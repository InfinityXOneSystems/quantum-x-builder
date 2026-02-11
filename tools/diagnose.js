#!/usr/bin/env node
/**
 * Diagnose Tool
 * Collects lint, type-check, and test results into a JSON summary for CI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, ignoreErrors = false) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { success: true, output };
  } catch (error) {
    if (ignoreErrors) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
      };
    }
    return { success: false, error: error.message };
  }
}

async function diagnose() {
  console.log('🔍 Running diagnostic checks...\n');

  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  // Check 1: ESLint
  console.log('Running ESLint...');
  const lintResult = runCommand('npm run lint', true);
  results.checks.lint = {
    name: 'ESLint',
    passed: lintResult.success,
    output: lintResult.output || lintResult.error,
  };
  results.summary.total++;
  if (lintResult.success) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }

  // Check 2: TypeScript
  console.log('Running TypeScript type check...');
  const typecheckResult = runCommand('npm run typecheck', true);
  results.checks.typecheck = {
    name: 'TypeScript',
    passed: typecheckResult.success,
    output: typecheckResult.output || typecheckResult.error,
  };
  results.summary.total++;
  if (typecheckResult.success) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }

  // Check 3: Tests
  console.log('Running tests...');
  const testResult = runCommand('npm run test --if-present', true);
  results.checks.tests = {
    name: 'Tests',
    passed: testResult.success,
    output: testResult.output || testResult.error,
  };
  results.summary.total++;
  if (testResult.success) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }

  // Check 4: Git status
  console.log('Checking git status...');
  const gitStatus = runCommand('git status --porcelain', true);
  results.checks.git = {
    name: 'Git Status',
    clean: !gitStatus.output || gitStatus.output.trim() === '',
    uncommitted: gitStatus.output?.split('\n').filter(Boolean) || [],
  };

  // Save results
  const outputDir = path.join(process.cwd(), '.maintenance');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'diagnose-report.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

  console.log('\n📊 Diagnostic Summary:');
  console.log(`   Total checks: ${results.summary.total}`);
  console.log(`   ✅ Passed: ${results.summary.passed}`);
  console.log(`   ❌ Failed: ${results.summary.failed}`);
  console.log(`\n📄 Full report saved to: ${outputFile}`);

  // Exit with error if any checks failed
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

diagnose().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
