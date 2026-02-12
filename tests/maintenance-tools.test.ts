import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Maintenance Tools', () => {
  it('should have diagnose tool', () => {
    const toolPath = path.join(process.cwd(), 'tools', 'diagnose.js');
    expect(fs.existsSync(toolPath)).toBe(true);
  });

  it('should have apply-fixes tool', () => {
    const toolPath = path.join(process.cwd(), 'tools', 'apply-fixes.js');
    expect(fs.existsSync(toolPath)).toBe(true);
  });

  it('should have optimize tool', () => {
    const toolPath = path.join(process.cwd(), 'tools', 'optimize.js');
    expect(fs.existsSync(toolPath)).toBe(true);
  });

  it('should have tsconfig.json in root', () => {
    const configPath = path.join(process.cwd(), 'tsconfig.json');
    expect(fs.existsSync(configPath)).toBe(true);

    // Just check for strict mode presence in the file content
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('"strict": true');
  });

  it('should have eslint configuration', () => {
    const configPath = path.join(process.cwd(), '.eslintrc.cjs');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('should have prettier configuration', () => {
    const configPath = path.join(process.cwd(), '.prettierrc');
    expect(fs.existsSync(configPath)).toBe(true);
  });
});

describe('Package Scripts', () => {
  it('should have lint script', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    expect(pkg.scripts.lint).toBeDefined();
    expect(pkg.scripts['lint:fix']).toBeDefined();
  });

  it('should have analyze script', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    expect(pkg.scripts.analyze).toBeDefined();
  });

  it('should have ci script', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    expect(pkg.scripts.ci).toBeDefined();
  });
});
