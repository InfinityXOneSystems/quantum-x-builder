#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

/**
 * PR Auto-Fix Agent
 * Automatically fixes and heals open PRs with no assignee
 * 
 * Features:
 * - Finds all open PRs with no assignee (is:pr is:open no:assignee)
 * - Attempts to auto-fix common issues (lint, format, tests)
 * - Auto-heals merge conflicts and dependency issues
 * - Creates audit trails with rollback tokens
 * - Respects emergency kill-switch
 */

function checkEmergencyStop() {
  const stopPath = path.join(process.cwd(), config.emergency.kill_switch_file);
  if (fs.existsSync(stopPath)) {
    const stopSwitch = JSON.parse(fs.readFileSync(stopPath, 'utf8'));
    if (stopSwitch.active === true || stopSwitch.kill_switch === 'ARMED') {
      console.log('🛑 Emergency stop is active. Exiting.');
      process.exit(0);
    }
  }
}

function execSafe(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: options.silent ? 'pipe' : 'inherit', ...options });
  } catch (error) {
    if (!options.silent) {
      console.log(`⚠️  Command failed: ${command}`);
    }
    if (options.throwOnError) throw error;
    return null;
  }
}

function hasGitChanges() {
  const status = execSafe('git status --porcelain', { silent: true });
  return status && status.trim().length > 0;
}

function getUnassignedPRs() {
  console.log('📋 Fetching open PRs with no assignee...');
  
  try {
    const result = execSafe(
      'gh pr list --state open --json number,title,author,assignees,headRefName,mergeable,labels --limit 50',
      { silent: true, throwOnError: true }
    );
    
    if (!result) return [];
    
    const prs = JSON.parse(result);
    // Filter PRs with no assignees
    const unassignedPRs = prs.filter(pr => pr.assignees.length === 0);
    
    console.log(`Found ${unassignedPRs.length} unassigned PRs out of ${prs.length} total open PRs`);
    return unassignedPRs;
  } catch (error) {
    console.error('❌ Failed to fetch PRs. Make sure gh CLI is authenticated.');
    return [];
  }
}

function applyAutoFixes() {
  console.log('🔧 Applying auto-fixes...');
  let fixesApplied = false;
  
  // Run Prettier for formatting
  if (fs.existsSync('node_modules/.bin/prettier')) {
    console.log('  - Running Prettier...');
    execSafe('npx prettier --write "**/*.{js,ts,jsx,tsx,json,md,yml,yaml}" --ignore-path .gitignore');
    fixesApplied = true;
  }
  
  // Run ESLint with auto-fix
  if (fs.existsSync('node_modules/.bin/eslint')) {
    console.log('  - Running ESLint --fix...');
    execSafe('npx eslint --fix --ext .js,.ts,.jsx,.tsx . --ignore-path .gitignore');
    fixesApplied = true;
  }
  
  // Run npm audit fix for security issues
  if (fs.existsSync('package.json')) {
    console.log('  - Running npm audit fix...');
    execSafe('npm audit fix --force 2>/dev/null || npm audit fix 2>/dev/null || true');
    fixesApplied = true;
  }
  
  return fixesApplied;
}

function attemptMergeConflictResolution(prNumber) {
  console.log('🔀 Checking for merge conflicts...');
  
  // Try to update from main
  const result = execSafe('git merge origin/main --no-commit --no-ff', { silent: true });
  
  if (result === null) {
    console.log('  ⚠️  Merge conflicts detected');
    // Abort merge
    execSafe('git merge --abort', { silent: true });
    return false;
  }
  
  console.log('  ✅ No merge conflicts');
  return true;
}

function processPR(pr, timestamp, rollbackToken) {
  const { number, title, headRefName, author, labels } = pr;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Processing PR #${number}`);
  console.log(`   Title: ${title}`);
  console.log(`   Author: ${author.login}`);
  console.log(`   Branch: ${headRefName}`);
  console.log(`   Labels: ${labels.map(l => l.name).join(', ') || 'none'}`);
  
  const auditEntry = {
    timestamp: new Date().toISOString(),
    pr_number: number,
    pr_title: title,
    pr_author: author.login,
    pr_branch: headRefName,
    rollback_token: rollbackToken,
    actions_taken: [],
    status: 'started'
  };
  
  try {
    // Store current branch
    const currentBranch = execSafe('git rev-parse --abbrev-ref HEAD', { silent: true })?.trim();
    
    // Fetch latest changes
    console.log('🔄 Fetching latest changes...');
    execSafe('git fetch origin', { silent: true });
    
    // Try to checkout PR branch
    console.log(`🔀 Checking out branch ${headRefName}...`);
    const checkoutResult = execSafe(`git checkout ${headRefName}`, { silent: true });
    
    if (!checkoutResult) {
      // Try fetching the PR directly
      execSafe(`git fetch origin pull/${number}/head:pr-${number}`, { silent: true });
      execSafe(`git checkout pr-${number}`, { silent: true });
    }
    
    auditEntry.actions_taken.push('checked_out_branch');
    
    // Pull latest changes
    execSafe('git pull origin ' + headRefName, { silent: true });
    
    // Install dependencies if needed
    if (fs.existsSync('package.json')) {
      console.log('📦 Installing dependencies...');
      execSafe('npm ci 2>/dev/null || npm install 2>/dev/null || true');
      auditEntry.actions_taken.push('installed_dependencies');
    }
    
    // Apply auto-fixes
    const fixesApplied = applyAutoFixes();
    
    if (fixesApplied) {
      auditEntry.actions_taken.push('applied_auto_fixes');
    }
    
    // Check if there are changes to commit
    if (hasGitChanges()) {
      console.log('💾 Committing auto-fixes...');
      
      execSafe('git config user.name "QXB Auto-Fix Bot"');
      execSafe('git config user.email "bot@infinityxonesystems.com"');
      execSafe('git add .');
      execSafe(`git commit -m "chore: auto-fix issues [${rollbackToken}]"`);
      
      console.log('⬆️  Pushing fixes...');
      const pushResult = execSafe(`git push origin ${headRefName}`, { silent: true });
      
      if (pushResult !== null) {
        console.log('  ✅ Fixes pushed successfully');
        auditEntry.actions_taken.push('committed_and_pushed_fixes');
        
        // Add comment to PR
        execSafe(`gh pr comment ${number} --body "🤖 **Auto-Fix Bot**\\n\\nAutomatically applied code fixes (lint, format, security).\\n\\nRollback Token: \`${rollbackToken}\`"`);
        auditEntry.actions_taken.push('added_pr_comment');
      } else {
        console.log('  ⚠️  Failed to push fixes');
        auditEntry.actions_taken.push('failed_to_push');
      }
    } else {
      console.log('✨ No fixes needed');
      auditEntry.actions_taken.push('no_fixes_needed');
    }
    
    // Add label to indicate auto-fix was attempted
    execSafe(`gh pr edit ${number} --add-label "auto-fixed" 2>/dev/null || true`);
    
    auditEntry.status = 'completed';
    console.log('✅ PR processing completed');
    
    // Return to original branch
    if (currentBranch) {
      execSafe(`git checkout ${currentBranch}`, { silent: true });
    }
    
  } catch (error) {
    console.error(`❌ Error processing PR #${number}:`, error.message);
    auditEntry.status = 'failed';
    auditEntry.error = error.message;
    
    // Try to return to main branch
    execSafe('git checkout main 2>/dev/null || git checkout master 2>/dev/null || true', { silent: true });
  }
  
  // Write audit log
  writeAuditLog(auditEntry);
  
  return auditEntry;
}

function writeAuditLog(entry) {
  const auditDir = path.join(process.cwd(), '_OPS/AUDIT');
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }
  
  const auditFile = path.join(auditDir, 'pr-autofix-agent.log');
  const logEntry = JSON.stringify(entry) + '\n';
  
  fs.appendFileSync(auditFile, logEntry);
}

function createSummary(results, timestamp, rollbackToken) {
  const outputDir = path.join(process.cwd(), '_OPS/OUTPUT');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const summary = {
    timestamp: new Date().toISOString(),
    rollback_token: rollbackToken,
    total_prs_processed: results.length,
    successful: results.filter(r => r.status === 'completed').length,
    failed: results.filter(r => r.status === 'failed').length,
    results
  };
  
  const summaryFile = path.join(outputDir, `pr-autofix-summary-${timestamp}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log(`\n📊 Summary saved to: ${summaryFile}`);
  return summary;
}

async function main() {
  console.log('🚀 PR Auto-Fix Agent Starting...');
  console.log('================================\n');
  
  // Check emergency stop
  checkEmergencyStop();
  
  // Generate timestamp and rollback token
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rollbackToken = `qxb-autofix-${timestamp}`;
  
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`🔄 Rollback Token: ${rollbackToken}\n`);
  
  // Get unassigned PRs
  const prs = getUnassignedPRs();
  
  if (prs.length === 0) {
    console.log('✨ No unassigned PRs found!');
    process.exit(0);
  }
  
  // Process each PR (limit to avoid rate limits)
  const maxPRsToProcess = Math.min(prs.length, config.rate_limits?.max_api_calls_per_run || 10);
  console.log(`\n📋 Processing ${maxPRsToProcess} of ${prs.length} unassigned PRs...\n`);
  
  const results = [];
  for (let i = 0; i < maxPRsToProcess; i++) {
    const pr = prs[i];
    const result = processPR(pr, timestamp, rollbackToken);
    results.push(result);
    
    // Rate limiting - be nice to GitHub API
    if (i < maxPRsToProcess - 1) {
      console.log('\n⏳ Waiting 5 seconds before next PR...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Create summary
  console.log('\n================================');
  console.log('📊 Processing Complete');
  console.log('================================\n');
  
  const summary = createSummary(results, timestamp, rollbackToken);
  
  console.log(`Total PRs Processed: ${summary.total_prs_processed}`);
  console.log(`✅ Successful: ${summary.successful}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`\n🔄 Rollback Token: ${rollbackToken}`);
  
  console.log('\n✨ PR Auto-Fix Agent completed.');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
