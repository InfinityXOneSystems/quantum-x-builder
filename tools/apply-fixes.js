#!/usr/bin/env node
/**
 * Apply Fixes Tool
 * Applies automated fixes and codemods
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.log(`⚠️  ${description} had issues (may be normal)`);
    return false;
  }
}

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only', { encoding: 'utf-8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

async function applyFixes() {
  console.log('🔧 Applying automated fixes...\n');

  const changedFilesBefore = getChangedFiles();

  // Step 1: Run ESLint --fix
  runCommand('npm run lint:fix', 'ESLint auto-fix');

  // Step 2: Run Prettier
  runCommand('npm run format', 'Prettier formatting');

  // Step 3: Run codemods (if any exist)
  const codemodsDir = path.join(process.cwd(), 'tools', 'codemods');
  if (fs.existsSync(codemodsDir)) {
    const codemods = fs
      .readdirSync(codemodsDir)
      .filter(f => f.endsWith('.js') || f.endsWith('.ts'));

    if (codemods.length > 0) {
      console.log(`\n📝 Found ${codemods.length} codemods to run`);
      for (const codemod of codemods) {
        const codemodPath = path.join(codemodsDir, codemod);
        runCommand(`node ${codemodPath}`, `Codemod: ${codemod}`);
      }
    } else {
      console.log('\n📝 No codemods found to run');
    }
  }

  // Check what changed
  const changedFilesAfter = getChangedFiles();
  const newChanges = changedFilesAfter.filter(f => !changedFilesBefore.includes(f));

  console.log('\n📄 Changed files:');
  if (changedFilesAfter.length === 0) {
    console.log('   No files were changed');
  } else {
    changedFilesAfter.forEach(file => {
      const marker = newChanges.includes(file) ? '📝' : '🔄';
      console.log(`   ${marker} ${file}`);
    });
  }

  // Save results
  const outputDir = path.join(process.cwd(), '.maintenance');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    changedFiles: changedFilesAfter,
    newChanges: newChanges,
  };

  fs.writeFileSync(
    path.join(outputDir, 'apply-fixes-report.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Fixes applied successfully');
}

applyFixes().catch(error => {
  console.error('❌ Apply fixes failed:', error);
  process.exit(1);
});
