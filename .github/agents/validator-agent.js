#!/usr/bin/env node
/**
 * Validation Agent
 * 
 * Responsibilities:
 * - Review all changes made by primary agent
 * - Run comprehensive validation suite
 * - Check PR quality and completeness
 * - Validate workflow syntax and logic
 * - Verify dependencies are compatible
 * - Approve or reject changes with detailed feedback
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
      validator: {
        enabled: true,
        strictMode: true,
        requiredChecks: ['test', 'lint', 'typecheck', 'build', 'security']
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

// Run tests
async function runTests() {
  console.log('\n🧪 Running tests...');
  
  if (!checkNpmAvailable()) {
    console.log('⚠️  npm not available, skipping tests');
    return { passed: false, reason: 'npm not available' };
  }

  const result = execCommand('npm test 2>&1', { silent: true });
  
  if (result.success) {
    console.log('✅ Tests passed');
    return { passed: true, output: result.output };
  }

  const output = result.output || '';
  const missingScript =
    output.includes('missing script: test') ||
    output.includes('Missing script: "test"') ||
    output.includes('ERROR: No test specified');

  if (missingScript) {
    console.log('⚠️  No npm "test" script defined, skipping tests');
    return {
      passed: false,
      output: result.output,
      reason: 'No npm "test" script defined'
    };
  }
  
  console.log('❌ Tests failed');
  return { passed: false, output: result.output, reason: 'Test failures detected' };
}

// Run lint check
async function runLintCheck() {
  console.log('\n📋 Running lint check...');
  
  if (!checkNpmAvailable()) {
    console.log('⚠️  npm not available, skipping lint check');
    return { passed: false, reason: 'npm not available' };
  }

  const result = execCommand('npm run lint 2>&1', { silent: true });
  
  if (result.success) {
    console.log('✅ Lint check passed');
    return { passed: true };
  }
  
  const output = result.output || '';
  const missingScript =
    output.includes('missing script: lint') ||
    output.includes('Missing script: "lint"');

  if (missingScript) {
    console.log('⚠️  No npm "lint" script defined, skipping lint check');
    return {
      passed: false,
      output: result.output,
      reason: 'No npm "lint" script defined'
    };
  }
  
  console.log('❌ Lint check failed');
  return { passed: false, output: result.output, reason: 'Linting errors detected' };
}

// Run TypeScript check
async function runTypeCheck() {
  console.log('\n🔍 Running TypeScript check...');
  
  if (!checkNpmAvailable()) {
    console.log('⚠️  npm not available, skipping TypeScript check');
    return { passed: false, reason: 'npm not available' };
  }

  const result = execCommand('npx tsc --noEmit 2>&1 || true', { silent: true });
  
  if (!result.output || !result.output.includes('error TS')) {
    console.log('✅ TypeScript check passed');
    return { passed: true };
  }
  
  const errorCount = (result.output.match(/error TS/g) || []).length;
  console.log(`❌ TypeScript check failed: ${errorCount} errors`);
  return { passed: false, errors: errorCount, output: result.output, reason: `${errorCount} TypeScript errors` };
}

// Run build
async function runBuild() {
  console.log('\n🔨 Running build...');
  
  if (!checkNpmAvailable()) {
    console.log('⚠️  npm not available, skipping build');
    return { passed: false, reason: 'npm not available' };
  }

  const result = execCommand('npm run build 2>&1', { silent: true });
  
  if (result.success) {
    console.log('✅ Build succeeded');
    return { passed: true };
  }
  
  const output = result.output || '';
  const missingScript =
    output.includes('missing script: build') ||
    output.includes('Missing script: "build"');

  if (missingScript) {
    console.log('⚠️  No npm "build" script defined, skipping build');
    return {
      passed: false,
      output: result.output,
      reason: 'No npm "build" script defined'
    };
  }
  
  console.log('❌ Build failed');
  return { passed: false, output: result.output, reason: 'Build errors detected' };
}

// Run security scan
async function runSecurityScan() {
  console.log('\n🔒 Running security scan...');
  
  if (!checkNpmAvailable()) {
    console.log('⚠️  npm not available, skipping security scan');
    return { passed: false, reason: 'npm not available' };
  }

  const result = execCommand('npm audit --json 2>&1 || true', { silent: true });
  
  let vulnerabilityCount = 0;
  let criticalCount = 0;
  let highCount = 0;
  
  try {
    if (result.output) {
      const auditData = JSON.parse(result.output);
      const vulns = auditData.metadata?.vulnerabilities || {};
      vulnerabilityCount = vulns.total || 0;
      criticalCount = vulns.critical || 0;
      highCount = vulns.high || 0;
    }
  } catch (e) {
    // Ignore parse errors
  }

  if (criticalCount > 0 || highCount > 0) {
    console.log(`❌ Security scan failed: ${criticalCount} critical, ${highCount} high vulnerabilities`);
    return { 
      passed: false, 
      vulnerabilities: vulnerabilityCount,
      critical: criticalCount,
      high: highCount,
      reason: `${criticalCount} critical and ${highCount} high severity vulnerabilities`
    };
  }
  
  if (vulnerabilityCount > 0) {
    console.log(`⚠️  Security scan passed with warnings: ${vulnerabilityCount} low/medium vulnerabilities`);
    return { passed: true, vulnerabilities: vulnerabilityCount, warnings: true };
  }
  
  console.log('✅ Security scan passed');
  return { passed: true, vulnerabilities: 0 };
}

// Validate PR changes
async function validatePRChanges() {
  console.log('\n📝 Validating PR changes...');
  
  // Prefer explicit base/head refs in CI (e.g. GitHub Actions), fall back to a sensible default
  const baseRef = process.env.GITHUB_BASE_REF;
  const headRef = process.env.GITHUB_HEAD_REF;

  let diffCommand;
  if (baseRef && headRef) {
    // Compare PR base and head; assume remote refs are available
    diffCommand = `git diff --name-only origin/${baseRef}...origin/${headRef}`;
  } else if (baseRef) {
    diffCommand = `git diff --name-only origin/${baseRef}...HEAD`;
  } else {
    // Fallback: check working tree changes (useful for local development)
    diffCommand = 'git status --porcelain';
  }

  const result = execCommand(diffCommand, { silent: true });

  if (!result.output || result.output.trim() === '') {
    console.log('ℹ️  No changes detected');
    return { hasChanges: false };
  }

  const changes = result.output
    .split('\n')
    .map(line => line.trim().replace(/^[MADRCU?!]\s+/, '')) // Remove git status prefixes
    .filter(line => line.length > 0);

  if (changes.length === 0) {
    console.log('ℹ️  No changes detected');
    return { hasChanges: false };
  }

  console.log(`✅ Found ${changes.length} changed files`);

  return {
    hasChanges: true,
    changeCount: changes.length,
    changes: changes.slice(0, 10) // First 10 changes
  };
}

// Calculate approval status
function calculateApprovalStatus(results, config) {
  const requiredChecks = config.validator.requiredChecks || [];
  const failures = [];
  const warnings = [];
  
  // Check required validations
  if (requiredChecks.includes('test') && !results.tests?.passed) {
    failures.push(results.tests?.reason || 'Tests failed');
  }
  
  if (requiredChecks.includes('lint') && !results.lint?.passed) {
    failures.push(results.lint?.reason || 'Lint failed');
  }
  
  if (requiredChecks.includes('typecheck') && !results.typecheck?.passed) {
    failures.push(results.typecheck?.reason || 'TypeScript check failed');
  }
  
  if (requiredChecks.includes('build') && !results.build?.passed) {
    failures.push(results.build?.reason || 'Build failed');
  }
  
  if (requiredChecks.includes('security') && !results.security?.passed) {
    failures.push(results.security?.reason || 'Security scan failed');
  }
  
  // Check for warnings
  if (results.security?.warnings) {
    warnings.push(`${results.security.vulnerabilities} low/medium security vulnerabilities`);
  }
  
  const approved = failures.length === 0;
  
  return { approved, failures, warnings };
}

// Generate validation report
async function generateReport(results, approval, config) {
  const report = {
    timestamp: new Date().toISOString(),
    approved: approval.approved,
    needsHealing: !approval.approved,
    summary: {
      tests: results.tests?.passed ? '✅ Passed' : '❌ Failed',
      lint: results.lint?.passed ? '✅ Passed' : '❌ Failed',
      typecheck: results.typecheck?.passed ? '✅ Passed' : '❌ Failed',
      build: results.build?.passed ? '✅ Passed' : '❌ Failed',
      security: results.security?.passed ? '✅ Passed' : '❌ Failed',
      changes: results.prChanges?.hasChanges ? `${results.prChanges.changeCount} files` : 'No changes'
    },
    failures: approval.failures,
    warnings: approval.warnings,
    recommendations: []
  };

  // Add specific recommendations
  if (!results.tests?.passed) {
    report.recommendations.push('Fix failing tests before merging');
  }
  if (!results.lint?.passed) {
    report.recommendations.push('Run lint fix to resolve code style issues');
  }
  if (!results.typecheck?.passed) {
    report.recommendations.push('Fix TypeScript type errors');
  }
  if (!results.build?.passed) {
    report.recommendations.push('Fix build errors');
  }
  if (!results.security?.passed) {
    report.recommendations.push('Address critical and high severity vulnerabilities');
  }

  // Generate markdown report
  const markdown = `
## 📊 Validation Agent Report

**Status:** ${report.approved ? '✅ APPROVED' : '❌ NEEDS WORK'}
**Timestamp:** ${report.timestamp}

### Validation Results

| Check | Status |
|-------|--------|
| Tests | ${report.summary.tests} |
| Lint | ${report.summary.lint} |
| TypeScript | ${report.summary.typecheck} |
| Build | ${report.summary.build} |
| Security | ${report.summary.security} |

### Changes
${report.summary.changes}

${approval.failures.length > 0 ? `
### ❌ Failures
${approval.failures.map((f, i) => `${i + 1}. ${f}`).join('\n')}
` : ''}

${approval.warnings.length > 0 ? `
### ⚠️ Warnings
${approval.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}
` : ''}

${report.recommendations.length > 0 ? `
### 💡 Recommendations
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

${report.approved ? '✅ **This PR is approved for merging.**' : '❌ **This PR requires changes before merging.**'}
`;

  report.markdown = markdown.trim();
  
  return report;
}

// Save report
async function saveReport(report) {
  const reportPath = path.join(__dirname, 'validation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  console.log('🔍 Validation Agent Starting...\n');
  console.log('='.repeat(60));
  
  const config = await loadConfig();
  
  if (!config.validator.enabled) {
    console.log('⚠️  Validator agent is disabled in config');
    return;
  }

  const results = {};

  // Run all validations
  results.tests = await runTests();
  results.lint = await runLintCheck();
  results.typecheck = await runTypeCheck();
  results.build = await runBuild();
  results.security = await runSecurityScan();
  results.prChanges = await validatePRChanges();

  // Calculate approval
  const approval = calculateApprovalStatus(results, config);

  // Generate and save report
  const report = await generateReport(results, approval, config);
  await saveReport(report);

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Validation Summary:');
  console.log('='.repeat(60));
  console.log(report.markdown);

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const fsSync = require('fs');
    fsSync.appendFileSync(process.env.GITHUB_OUTPUT, `needs_healing=${!report.approved}\n`);
    fsSync.appendFileSync(process.env.GITHUB_OUTPUT, `report_path=${path.join(__dirname, 'validation-report.json')}\n`);
  }

  console.log('\n✅ Validation Agent Completed!\n');
  
  // Exit with error code if not approved (in strict mode)
  if (config.validator.strictMode && !report.approved) {
    process.exit(1);
  }
}

// Run the agent
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation Agent Failed:', error);
    process.exit(1);
  });
}

module.exports = { main };
