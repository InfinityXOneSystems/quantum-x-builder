#!/usr/bin/env node

/**
 * TAP Parser - Parse TAP (Test Anything Protocol) output
 * Minimal implementation using tap-parser
 * Outputs JSON summary and exits non-zero on failures
 */

const fs = require('fs');
const path = require('path');

// Minimal TAP parser without external dependencies
function parseTAP(tapContent) {
  const lines = tapContent.split('\n');
  const results = {
    version: 13,
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    todo: 0,
    tests: [],
    status: 'unknown',
  };

  let inPlan = false;
  let planTotal = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // TAP version
    if (trimmed.startsWith('TAP version')) {
      const match = trimmed.match(/TAP version (\d+)/);
      if (match) {
        results.version = parseInt(match[1], 10);
      }
    }

    // Test plan (e.g., "1..5")
    else if (/^\d+\.\.\d+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\.(\d+)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);
        planTotal = end - start + 1;
        results.total = planTotal;
        inPlan = true;
      }
    }

    // Test result (ok/not ok)
    else if (/^(not )?ok/.test(trimmed)) {
      const isOk = !trimmed.startsWith('not ok');
      const match = trimmed.match(/^(not )?ok\s+(\d+)?\s*-?\s*(.*)/);

      if (match) {
        const testNum = match[2] ? parseInt(match[2], 10) : results.tests.length + 1;
        const description = match[3] || `Test ${testNum}`;

        const test = {
          number: testNum,
          ok: isOk,
          description: description.trim(),
        };

        // Check for TODO/SKIP directives
        if (/# TODO/i.test(description)) {
          test.todo = true;
          results.todo++;
        } else if (/# SKIP/i.test(description)) {
          test.skip = true;
          results.skipped++;
        } else if (isOk) {
          results.passed++;
        } else {
          results.failed++;
        }

        results.tests.push(test);
      }
    }

    // Bail out
    else if (trimmed.startsWith('Bail out!')) {
      results.bailout = true;
      results.bailoutReason = trimmed.substring(9).trim();
    }
  }

  // Determine overall status
  if (results.bailout) {
    results.status = 'bailout';
  } else if (results.failed > 0) {
    results.status = 'failed';
  } else if (results.passed === results.total && results.total > 0) {
    results.status = 'passed';
  } else if (results.total === 0) {
    results.status = 'no_tests';
  } else {
    results.status = 'incomplete';
  }

  return results;
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: tap-parse.js <tap-file>');
    process.exit(1);
  }

  const tapFile = args[0];

  if (!fs.existsSync(tapFile)) {
    console.error(`Error: TAP file not found: ${tapFile}`);
    const errorResult = {
      status: 'error',
      error: 'TAP file not found',
      file: tapFile,
    };
    console.log(JSON.stringify(errorResult, null, 2));
    process.exit(1);
  }

  try {
    const tapContent = fs.readFileSync(tapFile, 'utf8');
    const results = parseTAP(tapContent);

    // Output JSON summary
    console.log(JSON.stringify(results, null, 2));

    // Exit with error code if tests failed
    if (results.status === 'failed' || results.status === 'bailout') {
      process.exit(1);
    } else if (results.status === 'incomplete') {
      process.exit(2);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error parsing TAP file: ${error.message}`);
    const errorResult = {
      status: 'error',
      error: error.message,
      file: tapFile,
    };
    console.log(JSON.stringify(errorResult, null, 2));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseTAP };
