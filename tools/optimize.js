#!/usr/bin/env node
/**
 * Optimize Tool
 * Performs build and calculates bundle size, compares against baseline
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  let totalSize = 0;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function optimize() {
  console.log('🚀 Running optimization checks...\n');

  const results = {
    timestamp: new Date().toISOString(),
    builds: {},
    bundleSizes: {},
  };

  // Check if builds exist and measure their sizes
  const buildDirs = [
    { name: 'frontend', path: './frontend/dist' },
    { name: 'backend', path: './backend/dist' },
    { name: 'website', path: './website/build' },
  ];

  console.log('📦 Measuring bundle sizes...\n');

  for (const dir of buildDirs) {
    const fullPath = path.join(process.cwd(), dir.path);
    const size = getDirectorySize(fullPath);

    results.bundleSizes[dir.name] = {
      path: dir.path,
      bytes: size,
      formatted: formatBytes(size),
      exists: fs.existsSync(fullPath),
    };

    if (fs.existsSync(fullPath)) {
      console.log(`   ${dir.name}: ${formatBytes(size)}`);
    } else {
      console.log(`   ${dir.name}: Not built yet`);
    }
  }

  // Load baseline if exists
  const baselineFile = path.join(process.cwd(), '.maintenance', 'bundle-baseline.json');
  let baseline = null;

  if (fs.existsSync(baselineFile)) {
    baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf-8'));
    console.log('\n📊 Comparing against baseline...\n');

    for (const [name, current] of Object.entries(results.bundleSizes)) {
      if (baseline.bundleSizes[name] && current.exists) {
        const previousSize = baseline.bundleSizes[name].bytes;
        const currentSize = current.bytes;
        const diff = currentSize - previousSize;
        const percentChange = previousSize > 0 ? ((diff / previousSize) * 100).toFixed(2) : 0;

        if (diff > 0) {
          console.log(`   ${name}: +${formatBytes(diff)} (+${percentChange}%)`);
        } else if (diff < 0) {
          console.log(`   ${name}: ${formatBytes(diff)} (${percentChange}%)`);
        } else {
          console.log(`   ${name}: No change`);
        }

        // Warn if size increased by more than 10%
        if (percentChange > 10) {
          console.warn(`   ⚠️  ${name} bundle size increased significantly!`);
          results.warnings = results.warnings || [];
          results.warnings.push(`${name} bundle size increased by ${percentChange}%`);
        }
      }
    }
  } else {
    console.log('\n📝 No baseline found. Current sizes will be used as baseline.');
  }

  // Save results
  const outputDir = path.join(process.cwd(), '.maintenance');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, 'optimize-report.json'), JSON.stringify(results, null, 2));

  // Update baseline
  fs.writeFileSync(baselineFile, JSON.stringify(results, null, 2));

  console.log('\n✅ Optimization check completed');

  // Fail if there are warnings about significant size increases
  if (results.warnings && results.warnings.length > 0) {
    console.log('\n⚠️  Warnings detected:');
    results.warnings.forEach(w => console.log(`   - ${w}`));
    process.exit(1);
  }
}

optimize().catch(error => {
  console.error('❌ Optimize failed:', error);
  process.exit(1);
});
