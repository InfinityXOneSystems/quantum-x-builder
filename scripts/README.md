# Scripts Directory

This directory contains automation scripts for the Quantum-X-Builder project.

## Available Scripts

### Bulk PR Processing

#### `bulk-pr-processor.sh`
**Purpose**: Efficiently process multiple Dependabot PRs in bulk

**Usage**:
```bash
# Preview what would happen (recommended first step)
./scripts/bulk-pr-processor.sh --dry-run

# Process only safe PRs (patch/minor updates)
./scripts/bulk-pr-processor.sh --safe-only

# Full processing (use with caution)
./scripts/bulk-pr-processor.sh
```

**Features**:
- Automatically categorizes PRs by risk level
- Auto-merges safe updates (GitHub Actions, patch/minor npm)
- Labels risky PRs for manual review
- Creates audit trails with rollback tokens
- Respects kill-switch and safety guardrails

**Documentation**: [docs/BULK_PR_PROCESSING.md](../docs/BULK_PR_PROCESSING.md)

### Auto-Fix

#### `push-fixes.sh`
**Purpose**: Automatically fix linting issues and push to PR branches

**Usage**: Typically run by GitHub Actions workflows

**Features**:
- Runs ESLint and Prettier with --fix
- Protects forbidden paths (_OPS/POLICY, kill-switch)
- Creates rollback tokens
- Used by autopr-validator workflow

### TAP Parsing

#### `tap-parse.js`
**Purpose**: Parse TAP (Test Anything Protocol) test output

**Usage**: Automatically used by CI workflows

### Gemini Auto-Fix

#### `gemini_autofix.js`
**Purpose**: AI-powered code fixes using Gemini API

**Usage**: Experimental - used for intelligent code repairs

### Disable Workflows Script

#### `disable-workflows-except-qxb.js`
**Purpose**: Disable GitHub Actions workflows across all repositories EXCEPT quantum-x-builder

**Usage**:
```bash
# Preview what will be disabled (safe)
export GITHUB_TOKEN=ghp_your_token_here
node scripts/disable-workflows-except-qxb.js --dry-run

# Interactive mode - confirm each repository
node scripts/disable-workflows-except-qxb.js --interactive

# Automatic mode - disable all except quantum-x-builder
node scripts/disable-workflows-except-qxb.js --auto
```

**Features**:
- Automatic protection for quantum-x-builder (never disabled)
- Three modes: dry-run, interactive, automatic
- No external dependencies (pure Node.js)
- Works with personal accounts and organizations
- Clear reporting and error handling

**Documentation**: 
- Full guide: [docs/DISABLE_WORKFLOWS_GUIDE.md](../docs/DISABLE_WORKFLOWS_GUIDE.md)
- Quick reference: [DISABLE_WORKFLOWS_QUICK.md](../DISABLE_WORKFLOWS_QUICK.md)
- Implementation details: [docs/DISABLE_WORKFLOWS_IMPLEMENTATION.md](../docs/DISABLE_WORKFLOWS_IMPLEMENTATION.md)

**Requirements**:
- Node.js 16+
- GitHub Personal Access Token with `repo` and `workflow` scopes
- Get token at: https://github.com/settings/tokens

## GitHub Actions Integration

These scripts are used by workflows in `.github/workflows/`:

- **bulk-pr-processor.yml**: Runs bulk PR processing
- **autopr-validator.yml**: Auto-validates and fixes individual PRs
- **ci.yml**: Continuous integration testing

## Safety Features

All scripts include:
- ✅ Kill-switch checking
- ✅ Rollback token generation
- ✅ Audit trail logging
- ✅ Forbidden path protection

## Quick Start - Bulk PR Processing

If you have 18 pending Dependabot PRs:

```bash
# Step 1: Preview
./scripts/bulk-pr-processor.sh --dry-run --safe-only

# Step 2: Process safe PRs
./scripts/bulk-pr-processor.sh --safe-only

# Step 3: Check results
cat $(ls -t _OPS/OUTPUT/bulk-pr/summary-*.json | head -1) | jq .
```

This will typically:
- Merge ~12 safe PRs automatically
- Label ~4-6 risky PRs for manual review
- Complete in under 5 minutes

## Development

### Adding a New Script

1. Create the script in this directory
2. Make it executable: `chmod +x scripts/your-script.sh`
3. Add safety features:
   ```bash
   # Check kill-switch
   if [ -f "_OPS/SAFETY/KILL_SWITCH.json" ]; then
     if grep -iq "DISABLE_AUTONOMY" "_OPS/SAFETY/KILL_SWITCH.json"; then
       echo "Kill-switch activated"
       exit 1
     fi
   fi
   
   # Generate rollback token
   TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
   ROLLBACK_TOKEN="qxb-rollback-${TIMESTAMP}"
   ```
4. Document it in this README
5. Add workflow if needed in `.github/workflows/`

### Testing Scripts

```bash
# Check syntax
bash -n scripts/your-script.sh

# Dry run (if supported)
./scripts/your-script.sh --dry-run

# Monitor execution
./scripts/your-script.sh 2>&1 | tee /tmp/script-output.log
```

## Troubleshooting

### Script not executable
```bash
chmod +x scripts/your-script.sh
```

### Permission denied
```bash
# Check file permissions
ls -l scripts/your-script.sh

# Make executable
chmod +x scripts/your-script.sh
```

### Kill-switch activated
```bash
# Check kill-switch status
cat _OPS/SAFETY/KILL_SWITCH.json

# Disable if needed (with caution)
echo '{"status": "ACTIVE"}' > _OPS/SAFETY/KILL_SWITCH.json
```

## Best Practices

1. **Always test with dry-run first**
2. **Use safe-only mode for bulk operations**
3. **Check audit logs after execution**
4. **Keep rollback tokens for emergency recovery**
5. **Respect the kill-switch**

## Related Documentation

- [Bulk PR Processing Guide](../docs/BULK_PR_PROCESSING.md)
- [Quick Reference](../docs/BULK_PR_PROCESSING_QUICK_REF.md)
- [Auto-Ops README](../docs/auto-ops/README.md)
- [Rollback Procedures](../docs/auto-ops/rollback.sh)

---

For questions or issues, check the audit logs in `_OPS/AUDIT/` or GitHub Actions workflow runs.
