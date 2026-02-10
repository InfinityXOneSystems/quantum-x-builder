# How to Use Rollback Scripts Locally

## Quick Answer

**Yes, you need to pull the script to use it on your local machine!** Here are your options:

---

## Option 1: Pull the Branch (Recommended for Testing)

If you want to test the new PowerShell script before it's merged:

```bash
# Pull the branch with the new script
git fetch origin
git checkout copilot/create-rollback-command

# Navigate to the scripts
cd docs/auto-ops

# Use the script
# For Linux/macOS:
./rollback.sh -h

# For Windows PowerShell:
.\rollback.ps1 -Help
```

---

## Option 2: Wait for PR Merge (Recommended for Production)

Once the PR is merged to main:

```bash
# Update your local repository
git checkout main
git pull origin main

# Navigate to the scripts
cd docs/auto-ops

# Use the script
./rollback.sh -h       # Linux/macOS
.\rollback.ps1 -Help   # Windows
```

---

## Option 3: Download Just the Script File

If you only need the script without pulling the whole branch:

### For PowerShell (Windows):

1. Download the file directly from GitHub:
   - Go to: `https://github.com/InfinityXOneSystems/quantum-x-builder/blob/copilot/create-rollback-command/docs/auto-ops/rollback.ps1`
   - Click "Raw" button
   - Save the file as `rollback.ps1`

2. Or use curl/wget:
   ```bash
   curl -o rollback.ps1 https://raw.githubusercontent.com/InfinityXOneSystems/quantum-x-builder/copilot/create-rollback-command/docs/auto-ops/rollback.ps1
   ```

3. Run it:
   ```powershell
   .\rollback.ps1 -Help
   ```

### For Bash (Linux/macOS):

The bash script already exists in main, so just:
```bash
git pull origin main
cd docs/auto-ops
./rollback.sh -h
```

---

## Quick Start After Pulling

### Windows PowerShell:
```powershell
cd docs/auto-ops
.\rollback.ps1 -Limit 10                              # List recent rollback tokens
.\rollback.ps1 -Date 20260209                         # Search by date
.\rollback.ps1 -Token qxb-rollback-20260209T033000Z   # Get detailed instructions
```

### Linux/macOS:
```bash
cd docs/auto-ops
./rollback.sh -l 10              # List recent rollback tokens
./rollback.sh -d 20260209        # Search by date
./rollback.sh -t <token>         # Get detailed instructions
```

---

## Troubleshooting

### PowerShell Execution Policy Error

If you get an error about execution policy on Windows:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Permission Denied on Linux/macOS

Make the script executable:
```bash
chmod +x docs/auto-ops/rollback.sh
```

---

## Need More Help?

- **Quick Start Guide**: [ROLLBACK_QUICK_START.md](./ROLLBACK_QUICK_START.md)
- **Full Documentation**: [README.md](./README.md)
- **Emergency Procedures**: [../../_OPS/ROLLBACK/README.md](../../_OPS/ROLLBACK/README.md)

---

## Current Branch Info

- **Branch**: `copilot/create-rollback-command`
- **Status**: PR pending review
- **Files Added**:
  - `docs/auto-ops/rollback.ps1` (NEW - PowerShell version)
  - `docs/auto-ops/ROLLBACK_QUICK_START.md` (NEW - Quick start guide)
- **Files Updated**:
  - `docs/auto-ops/README.md`
  - `_OPS/ROLLBACK/README.md`

Once the PR is merged, you can pull from `main` instead of the feature branch.
