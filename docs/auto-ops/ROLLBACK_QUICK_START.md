# Rollback Quick Start Guide

## Overview

The rollback system helps you find and revert automated changes using rollback tokens embedded in commit messages.

## Available Scripts

### Linux/macOS: `rollback.sh`
Bash script for Unix-like systems

### Windows: `rollback.ps1`
PowerShell script for Windows systems

Both scripts provide identical functionality with platform-appropriate syntax.

## Common Use Cases

### 1. List Recent Rollback Tokens

**Linux/macOS:**
```bash
cd docs/auto-ops
./rollback.sh -l 10
```

**Windows:**
```powershell
cd docs/auto-ops
.\rollback.ps1 -Limit 10
```

### 2. Search by Date

Find all rollback tokens from a specific date (format: YYYYMMDD)

**Linux/macOS:**
```bash
./rollback.sh -d 20260208
```

**Windows:**
```powershell
.\rollback.ps1 -Date 20260208
```

### 3. Find Specific Token

Get detailed rollback instructions for a specific token

**Linux/macOS:**
```bash
./rollback.sh -t qxb-rollback-20260208T143022Z
```

**Windows:**
```powershell
.\rollback.ps1 -Token qxb-rollback-20260208T143022Z
```

This will show:
- Commit SHA and details
- Step-by-step revert instructions
- Commands to create a rollback branch
- Commands to create a PR for review

### 4. Get Help

**Linux/macOS:**
```bash
./rollback.sh -h
```

**Windows:**
```powershell
.\rollback.ps1 -Help
```

## Rollback Token Format

All automated commits include tokens in this format:
```
qxb-rollback-YYYYMMDDTHHMMSSZ
```

Example: `qxb-rollback-20260208T143022Z`
- `20260208` = Date (February 8, 2026)
- `T143022Z` = Time (14:30:22 UTC)

## Important Safety Notes

⚠️ **All rollbacks require human review before merging**

When you run the script with a specific token (`-t` or `-Token`), it will provide commands to:
1. Review the commit
2. Create a revert commit
3. Create a new branch
4. Push the branch
5. Create a PR for review

**Never merge a revert PR without human review!**

## Troubleshooting

### No commits found

If you see "No commits found matching pattern", it means:
- No commits exist with rollback tokens yet, OR
- The date/token you searched for doesn't exist

Try searching for all tokens:
```bash
# Linux/macOS
./rollback.sh -l 20

# Windows
.\rollback.ps1 -Limit 20
```

### PowerShell execution policy

If you get an execution policy error on Windows:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try running the script again.

## See Also

- [Auto-Ops README](README.md) - Full autonomous operations documentation
- [_OPS/ROLLBACK/README.md](../../_OPS/ROLLBACK/README.md) - Emergency rollback procedures
