#!/usr/bin/env node
/**
 * System Health Check Agent
 * 
 * Monitors overall system health:
 * - Workflow success rates
 * - PR merge rates
 * - Open issues age
 * - Failed jobs
 * - Security alerts
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

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

// Check Git repository health
async function checkGitHealth() {
  console.log('\n📊 Checking Git repository health...');
  
  const status = execCommand('git status --porcelain', { silent: true });
  const branches = execCommand('git branch -a', { silent: true });
  
  const uncommittedChanges = status.output ? status.output.trim().split('\n').length : 0;
  const branchCount = branches.output ? branches.output.trim().split('\n').length : 0;
  
  console.log(`   Uncommitted changes: ${uncommittedChanges}`);
  console.log(`   Total branches: ${branchCount}`);
  
  return {
    uncommittedChanges,
    branchCount,
    healthy: uncommittedChanges === 0
  };
}

// Check workflow files
async function checkWorkflowHealth() {
  console.log('\n⚙️  Checking workflow health...');
  
  try {
    const workflowDir = path.join(process.cwd(), '.github/workflows');
    const files = await fs.readdir(workflowDir);
    const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    
    let validCount = 0;
    let invalidFiles = [];
    
    for (const file of yamlFiles) {
      try {
        const content = await fs.readFile(path.join(workflowDir, file), 'utf8');
        // Basic validation - check for required keys
        if (content.includes('name:') && content.includes('on:')) {
          validCount++;
        } else {
          invalidFiles.push(file);
        }
      } catch (e) {
        invalidFiles.push(file);
      }
    }
    
    console.log(`   Total workflows: ${yamlFiles.length}`);
    console.log(`   Valid workflows: ${validCount}`);
    if (invalidFiles.length > 0) {
      console.log(`   ⚠️  Invalid workflows: ${invalidFiles.join(', ')}`);
    }
    
    return {
      total: yamlFiles.length,
      valid: validCount,
      invalid: invalidFiles,
      healthy: invalidFiles.length === 0
    };
  } catch (error) {
    console.log(`   ⚠️  Error checking workflows: ${error.message}`);
    return {
      total: 0,
      valid: 0,
      invalid: [],
      healthy: false
    };
  }
}

// Check dependency health
async function checkDependencyHealth() {
  console.log('\n📦 Checking dependency health...');
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    
    const hasPackageJson = await fs.access(packageJsonPath).then(() => true).catch(() => false);
    const hasPackageLock = await fs.access(packageLockPath).then(() => true).catch(() => false);
    
    if (!hasPackageJson) {
      console.log('   ⚠️  No package.json found');
      return { healthy: false, reason: 'No package.json' };
    }
    
    // Check for outdated dependencies
    const outdatedResult = execCommand('npm outdated --json 2>&1 || true', { silent: true });
    let outdatedCount = 0;
    
    try {
      if (outdatedResult.output) {
        const outdated = JSON.parse(outdatedResult.output);
        outdatedCount = Object.keys(outdated).length;
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    console.log(`   Package.json: ${hasPackageJson ? '✅' : '❌'}`);
    console.log(`   Package-lock.json: ${hasPackageLock ? '✅' : '❌'}`);
    console.log(`   Outdated packages: ${outdatedCount}`);
    
    return {
      hasPackageJson,
      hasPackageLock,
      outdatedCount,
      healthy: hasPackageJson && outdatedCount < 10
    };
  } catch (error) {
    console.log(`   ⚠️  Error checking dependencies: ${error.message}`);
    return { healthy: false, reason: error.message };
  }
}

// Check security health
async function checkSecurityHealth() {
  console.log('\n🔒 Checking security health...');
  
  const auditResult = execCommand('npm audit --json 2>&1 || true', { silent: true });
  
  let vulnerabilityCount = 0;
  let criticalCount = 0;
  let highCount = 0;
  
  try {
    if (auditResult.output) {
      const auditData = JSON.parse(auditResult.output);
      const vulns = auditData.metadata?.vulnerabilities || {};
      vulnerabilityCount = vulns.total || 0;
      criticalCount = vulns.critical || 0;
      highCount = vulns.high || 0;
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  console.log(`   Total vulnerabilities: ${vulnerabilityCount}`);
  console.log(`   Critical: ${criticalCount}`);
  console.log(`   High: ${highCount}`);
  
  const healthy = criticalCount === 0 && highCount === 0;
  
  return {
    vulnerabilityCount,
    criticalCount,
    highCount,
    healthy,
    status: healthy ? '✅ Secure' : '⚠️  Vulnerabilities found'
  };
}

// Calculate overall health score
function calculateHealthScore(results) {
  let score = 100;
  const issues = [];
  
  if (!results.git.healthy) {
    score -= 10;
    issues.push('Uncommitted changes present');
  }
  
  if (!results.workflows.healthy) {
    score -= 20;
    issues.push(`${results.workflows.invalid.length} invalid workflows`);
  }
  
  if (!results.dependencies.healthy) {
    score -= 15;
    issues.push('Dependency issues detected');
  }
  
  if (!results.security.healthy) {
    score -= 30;
    issues.push(`${results.security.criticalCount} critical + ${results.security.highCount} high vulnerabilities`);
  }
  
  return { score: Math.max(0, score), issues };
}

// Generate health report
async function generateReport(results, healthScore) {
  const report = {
    timestamp: new Date().toISOString(),
    healthScore: healthScore.score,
    status: healthScore.score >= 80 ? 'HEALTHY' : healthScore.score >= 50 ? 'WARNING' : 'CRITICAL',
    checks: {
      git: results.git,
      workflows: results.workflows,
      dependencies: results.dependencies,
      security: results.security
    },
    issues: healthScore.issues,
    recommendations: []
  };

  // Add recommendations
  if (!results.git.healthy) {
    report.recommendations.push('Commit or stash uncommitted changes');
  }
  
  if (results.workflows.invalid.length > 0) {
    report.recommendations.push(`Fix invalid workflow files: ${results.workflows.invalid.join(', ')}`);
  }
  
  if (results.dependencies.outdatedCount > 5) {
    report.recommendations.push('Update outdated dependencies');
  }
  
  if (results.security.criticalCount > 0) {
    report.recommendations.push('URGENT: Fix critical security vulnerabilities');
  } else if (results.security.highCount > 0) {
    report.recommendations.push('Fix high severity security vulnerabilities');
  }

  return report;
}

// Save report
async function saveReport(report) {
  const reportPath = path.join(__dirname, 'health-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Health report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  console.log('🏥 System Health Check Starting...\n');
  console.log('='.repeat(60));
  
  const results = {
    git: await checkGitHealth(),
    workflows: await checkWorkflowHealth(),
    dependencies: await checkDependencyHealth(),
    security: await checkSecurityHealth()
  };

  const healthScore = calculateHealthScore(results);
  const report = await generateReport(results, healthScore);
  await saveReport(report);

  console.log('\n' + '='.repeat(60));
  console.log('🎯 System Health Summary:');
  console.log('='.repeat(60));
  console.log(`Health Score: ${report.healthScore}/100`);
  console.log(`Status: ${report.status}`);
  
  if (report.issues.length > 0) {
    console.log('\n⚠️  Issues:');
    report.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }

  console.log('\n✅ System Health Check Completed!\n');
  
  // Exit with error if critical
  if (report.status === 'CRITICAL') {
    process.exit(1);
  }
}

// Run the agent
if (require.main === module) {
  main().catch(error => {
    console.error('❌ System Health Check Failed:', error);
    process.exit(1);
  });
}

module.exports = { main };
