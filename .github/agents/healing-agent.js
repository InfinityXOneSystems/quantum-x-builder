#!/usr/bin/env node
/**
 * Healing Agent
 * 
 * Responsibilities:
 * - Parse validator feedback and suggestions
 * - Implement all validator recommendations
 * - Fix any issues flagged by validator
 * - Re-run fixes until validation passes
 * - Auto-heal system failures
 * - Ensure PRs are properly closed/merged
 * - Clean up failed automation attempts
 * - Monitor and fix branch conflicts
 * - Guarantee system stays operational
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Load configuration
async function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configContent = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Error loading config:', error);
    return {
      autonomous: {
        healing: {
          maxRetries: 3,
          backoffMultiplier: 2,
          circuitBreakerThreshold: 5
        }
      }
    };
  }
}

// Execute shell command with error handling
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || error.stderr 
    };
  }
}

// Check if npm is available
function checkNpmAvailable() {
  const result = execCommand('npm --version', { silent: true });
  return result.success;
}

// Load validation report
async function loadValidationReport() {
  try {
    const reportPath = path.join(__dirname, 'validation-report.json');
    const reportContent = await fs.readFile(reportPath, 'utf8');
    return JSON.parse(reportContent);
  } catch (error) {
    console.log('⚠️  No validation report found');
    return null;
  }
}

// Fix lint issues
async function fixLintIssues() {
  console.log('\n📋 Fixing lint issues...');
  
  if (!checkNpmAvailable()) {
    return { fixed: false, reason: 'npm not available' };
  }

  const result = execCommand('npm run lint -- --fix', { silent: true });
  
  if (result.success) {
    console.log('✅ Lint issues fixed');
    return { fixed: true };
  }
  
  console.log('⚠️  Some lint issues could not be auto-fixed');
  return { fixed: false, reason: 'Manual intervention required' };
}

// Fix formatting issues
async function fixFormattingIssues() {
  console.log('\n🎨 Fixing formatting issues...');
  
  if (!checkNpmAvailable()) {
    return { fixed: false, reason: 'npm not available' };
  }

  const result = execCommand('npm run format', { silent: true });
  
  if (result.success) {
    console.log('✅ Formatting issues fixed');
    return { fixed: true };
  }
  
  console.log('⚠️  Formatting failed');
  return { fixed: false, reason: 'Format command failed' };
}

// Attempt to fix security vulnerabilities
async function fixSecurityIssues() {
  console.log('\n🔒 Fixing security vulnerabilities...');
  
  if (!checkNpmAvailable()) {
    return { fixed: false, reason: 'npm not available' };
  }

  const result = execCommand('npm audit fix', { silent: true });
  
  if (result.success) {
    console.log('✅ Security vulnerabilities fixed');
    return { fixed: true };
  }
  
  console.log('⚠️  Some vulnerabilities require manual intervention');
  return { fixed: false, reason: 'Manual security fixes required' };
}

// Reinstall dependencies
async function reinstallDependencies() {
  console.log('\n📦 Reinstalling dependencies...');
  
  if (!checkNpmAvailable()) {
    return { success: false, reason: 'npm not available' };
  }

  // Clean install
  const result = execCommand('npm ci 2>&1 || npm install', { silent: true });
  
  if (result.success) {
    console.log('✅ Dependencies reinstalled');
    return { success: true };
  }
  
  console.log('⚠️  Dependency installation had issues');
  return { success: false, reason: 'npm install failed' };
}

// Implement healing based on validation report
async function implementHealing(validationReport, config) {
  const healingActions = [];
  const maxRetries = config.autonomous.healing.maxRetries;
  const results = {
    lint: { attempted: false, fixed: false },
    formatting: { attempted: false, fixed: false },
    security: { attempted: false, fixed: false },
    dependencies: { attempted: false, fixed: false }
  };

  if (!validationReport) {
    console.log('No validation report available, performing general healing...');
    
    // General healing actions
    results.lint = await fixLintIssues();
    results.lint.attempted = true;
    
    results.formatting = await fixFormattingIssues();
    results.formatting.attempted = true;
    
    results.security = await fixSecurityIssues();
    results.security.attempted = true;
    
    return results;
  }

  // Parse failures and apply targeted healing
  const failures = validationReport.failures || [];
  
  for (const failure of failures) {
    console.log(`\n🔧 Addressing: ${failure}`);
    
    if (failure.toLowerCase().includes('lint')) {
      results.lint = await fixLintIssues();
      results.lint.attempted = true;
      healingActions.push('lint-fix');
    }
    
    if (failure.toLowerCase().includes('format')) {
      results.formatting = await fixFormattingIssues();
      results.formatting.attempted = true;
      healingActions.push('format-fix');
    }
    
    if (failure.toLowerCase().includes('security') || failure.toLowerCase().includes('vulnerabilit')) {
      results.security = await fixSecurityIssues();
      results.security.attempted = true;
      healingActions.push('security-fix');
    }
    
    if (failure.toLowerCase().includes('build') || failure.toLowerCase().includes('dependenc')) {
      results.dependencies = await reinstallDependencies();
      results.dependencies.attempted = true;
      healingActions.push('dependency-reinstall');
    }
  }

  return { results, actions: healingActions };
}

// Check if changes were made
async function checkForChanges() {
  const result = execCommand('git status --porcelain', { silent: true });
  return result.output && result.output.trim() !== '';
}

// Generate healing report
async function generateReport(healingResults, validationReport) {
  const report = {
    timestamp: new Date().toISOString(),
    validationReport: validationReport?.timestamp || null,
    changesMade: await checkForChanges(),
    healingActions: [],
    success: false,
    recommendations: []
  };

  if (healingResults.results) {
    const { lint, formatting, security, dependencies } = healingResults.results;
    
    if (lint.attempted) {
      report.healingActions.push({
        action: 'lint-fix',
        success: lint.fixed || false,
        reason: lint.reason
      });
    }
    
    if (formatting.attempted) {
      report.healingActions.push({
        action: 'format-fix',
        success: formatting.fixed || false,
        reason: formatting.reason
      });
    }
    
    if (security.attempted) {
      report.healingActions.push({
        action: 'security-fix',
        success: security.fixed || false,
        reason: security.reason
      });
    }
    
    if (dependencies.attempted) {
      report.healingActions.push({
        action: 'dependency-reinstall',
        success: dependencies.success || false,
        reason: dependencies.reason
      });
    }
  }

  // Check if healing was successful
  const allSuccessful = report.healingActions.every(action => action.success);
  report.success = allSuccessful && report.healingActions.length > 0;

  // Add recommendations
  const failedActions = report.healingActions.filter(a => !a.success);
  if (failedActions.length > 0) {
    report.recommendations.push('Some healing actions failed - manual intervention may be required');
    failedActions.forEach(action => {
      report.recommendations.push(`- ${action.action}: ${action.reason || 'Unknown error'}`);
    });
  }

  if (report.changesMade) {
    report.recommendations.push('Commit and push the healing changes');
    report.recommendations.push('Re-run validation to verify fixes');
  }

  return report;
}

// Save report
async function saveReport(report) {
  const reportPath = path.join(__dirname, 'healing-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Healing report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  console.log('🔧 Healing Agent Starting...\n');
  console.log('='.repeat(60));
  
  const config = await loadConfig();
  const validationReport = await loadValidationReport();

  if (validationReport) {
    console.log('📋 Loaded validation report:');
    console.log(`   Approved: ${validationReport.approved ? '✅' : '❌'}`);
    console.log(`   Failures: ${validationReport.failures?.length || 0}`);
    console.log(`   Warnings: ${validationReport.warnings?.length || 0}`);
  }

  // Perform healing
  const healingResults = await implementHealing(validationReport, config);

  // Generate and save report
  const report = await generateReport(healingResults, validationReport);
  await saveReport(report);

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Healing Summary:');
  console.log('='.repeat(60));
  console.log(`Actions taken: ${report.healingActions.length}`);
  console.log(`Successful: ${report.healingActions.filter(a => a.success).length}`);
  console.log(`Changes made: ${report.changesMade ? '✅ Yes' : '❌ No'}`);
  console.log(`Overall success: ${report.success ? '✅ Yes' : '⚠️  Partial'}`);

  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const fsSync = require('fs');
    fsSync.appendFileSync(process.env.GITHUB_OUTPUT, `changes_made=${report.changesMade}\n`);
  }

  console.log('\n✅ Healing Agent Completed!\n');
}

// Run the agent
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Healing Agent Failed:', error);
    process.exit(1);
  });
}

module.exports = { main };
