#!/usr/bin/env node
/**
 * Example Codemod: Convert console.log to logger
 * Updated to support both CommonJS and ESM environments when loading ts-morph.
 * This file is an example placeholder — the transformation logic is commented out
 * to avoid accidental changes. Install ts-morph (devDependency) to enable real runs:
 *
 *   npm install --save-dev ts-morph
 */

async function runCodemod() {
  console.log('Running example codemod...');

  try {
    let Project;

    // Load ts-morph in a way that works in both CommonJS and ESM contexts.
    // Using typeof require === 'function' keeps this safe in ESM where `require` is not defined.
    try {
      if (typeof require === 'function') {
        ({ Project } = require('ts-morph'));
      } else {
        ({ Project } = await import('ts-morph'));
      }
    } catch (loadError) {
      // ts-morph not installed - this is okay for the example
      if (loadError.code === 'MODULE_NOT_FOUND' || loadError.code === 'ERR_MODULE_NOT_FOUND') {
        console.log('ts-morph not found. Install with: npm install --save-dev ts-morph');
        console.log('Example codemod completed (no changes made)');
        return;
      }
      throw loadError;
    }

    // This is a placeholder. When you want to run real codemods:
    // 1. Uncomment the code below
    // 2. Install ts-morph: npm install --save-dev ts-morph
    // 3. Customize the codemod logic

    // Verify ts-morph loaded successfully
    console.log('ts-morph loaded successfully:', Project.name);

    // const project = new Project({
    //   tsConfigFilePath: './tsconfig.json',
    // });
    //
    // const sourceFiles = project.getSourceFiles('tools/**/*.ts');
    //
    // for (const sourceFile of sourceFiles) {
    //   // Example: Find and transform code patterns
    //   sourceFile.forEachDescendant(node => {
    //     // Your transformation logic here
    //   });
    //
    //   // Use the async save API to be compatible with ESM runtimes
    //   await sourceFile.save();
    // }
    //
    // console.log(`Processed ${sourceFiles.length} files`);

    console.log('Example codemod completed (no changes made)');
  } catch (error) {
    console.error('Codemod failed:', error);
    // Set exit code for CI rather than forcing immediate exit so callers can perform cleanup
    process.exitCode = 1;
  }
}

runCodemod();
