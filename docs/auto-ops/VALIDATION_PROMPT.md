# Rollback Script Validation Prompt

Copy and paste this entire prompt to Copilot or any validation agent:

---

## VALIDATION TASK

Please validate the rollback helper scripts in this repository. These scripts help find and revert automated commits that contain rollback tokens.

## CONTEXT

**Repository**: InfinityXOneSystems/quantum-x-builder
**Branch**: copilot/create-rollback-command
**Location**: docs/auto-ops/

**Files to validate**:
- `rollback.sh` (Bash version for Linux/macOS)
- `rollback.ps1` (PowerShell version for Windows)

**Purpose**: These scripts search git history for commits with rollback tokens (format: `qxb-rollback-YYYYMMDDTHHMMSSZ`) and provide detailed revert instructions.

## VALIDATION STEPS

### 1. Verify Files Exist

Check that both scripts exist and are executable:

```bash
ls -la docs/auto-ops/rollback.*
```

**Expected output**: Both files should exist with execute permissions.

### 2. Test Help Function

**Bash version**:
```bash
cd docs/auto-ops
./rollback.sh -h
```

**PowerShell version**:
```bash
cd docs/auto-ops
pwsh -File rollback.ps1 -Help
```

**Expected output**: Both should display usage information with:
- Description of options (-t/-Token, -d/-Date, -l/-Limit, -h/-Help)
- Example commands
- Clean formatting

### 3. Test Search Functionality

**Test with no results** (when no rollback tokens exist):

```bash
# Bash
./rollback.sh -l 5

# PowerShell
pwsh -File rollback.ps1 -Limit 5
```

**Expected output**: 
- "No commits found matching pattern: qxb-rollback-"
- Exit code 1 (error)
- Should handle gracefully without crashing

### 4. Test with Real Rollback Token

**Create a test repository with a rollback token**:

```bash
# Setup test
mkdir -p /tmp/rollback-test
cd /tmp/rollback-test
git init
git config user.email "test@example.com"
git config user.name "Test User"
echo "test" > test.txt
git add test.txt
git commit -m "Test commit qxb-rollback-20260209T100000Z"
```

**Test Bash script**:
```bash
bash /path/to/docs/auto-ops/rollback.sh -l 1
```

**Test PowerShell script**:
```bash
pwsh -File /path/to/docs/auto-ops/rollback.ps1 -Limit 1
```

**Expected output**:
- Should find the commit
- Display commit SHA and message
- Show suggestion to use -t/-Token flag for details

### 5. Test Detailed Token Search

**With the test repo from step 4**:

```bash
# Bash
bash /path/to/docs/auto-ops/rollback.sh -t qxb-rollback-20260209T100000Z

# PowerShell
pwsh -File /path/to/docs/auto-ops/rollback.ps1 -Token qxb-rollback-20260209T100000Z
```

**Expected output** (both scripts should show):
1. Commit details
2. Step-by-step revert instructions:
   - `git show <sha>`
   - `git revert <sha>`
   - Branch creation commands
   - Push commands
   - PR creation commands
3. Warning about human review requirement
4. Commit statistics

### 6. Test Date Search

**With the test repo**:

```bash
# Bash
bash /path/to/docs/auto-ops/rollback.sh -d 20260209

# PowerShell
pwsh -File /path/to/docs/auto-ops/rollback.ps1 -Date 20260209
```

**Expected output**: Should find commits matching that date pattern.

### 7. Verify Output Consistency

Compare outputs from both scripts - they should be functionally identical with only syntax differences:
- Same emoji/icons (🔄, 🔍, 📋, 📝, ⚠️, ✅)
- Same information displayed
- Same error handling
- Same exit codes

### 8. Test Error Handling

**Test invalid scenarios**:

```bash
# Non-existent token
./rollback.sh -t qxb-rollback-99999999T999999Z

# Invalid date
./rollback.sh -d invalid

# Running outside git repo
cd /tmp
./rollback.sh -l 5
```

**Expected**: Graceful error messages, no crashes, appropriate exit codes.

### 9. Verify PowerShell Best Practices

Check the PowerShell script (`rollback.ps1`):

```bash
grep -n "Write-Error" docs/auto-ops/rollback.ps1
```

**Expected**: Should use `Write-ErrorMessage`, NOT `Write-Error` (to avoid built-in cmdlet conflict).

### 10. Check Documentation

Verify documentation files exist and are accurate:

```bash
ls -la docs/auto-ops/README.md
ls -la docs/auto-ops/ROLLBACK_QUICK_START.md
ls -la docs/auto-ops/HOW_TO_USE_LOCALLY.md
ls -la _OPS/ROLLBACK/README.md
```

**Expected**: All files should exist and mention both scripts.

## VALIDATION CHECKLIST

Confirm all of the following:

- [ ] Both scripts exist and are executable
- [ ] Help commands work for both scripts
- [ ] Both scripts handle "no results" gracefully
- [ ] Both scripts can find rollback tokens
- [ ] Detailed token search shows complete revert instructions
- [ ] Date search works correctly
- [ ] Outputs are consistent between Bash and PowerShell versions
- [ ] Error handling is robust (no crashes)
- [ ] PowerShell script avoids built-in cmdlet conflicts
- [ ] All documentation files exist
- [ ] Documentation accurately describes both scripts
- [ ] Scripts follow repository patterns (colored output, error handling)

## SUCCESS CRITERIA

✅ **PASS** if:
- All validation steps complete successfully
- Both scripts produce identical functional output
- Error handling is graceful
- Documentation is complete and accurate

❌ **FAIL** if:
- Either script crashes or produces errors
- Outputs differ significantly between versions
- Documentation is missing or incorrect
- PowerShell script conflicts with built-in cmdlets

## ADDITIONAL NOTES

- **Rollback Token Format**: `qxb-rollback-YYYYMMDDTHHMMSSZ`
  - Example: `qxb-rollback-20260209T143022Z`
  - YYYY = year, MM = month, DD = day
  - T = separator
  - HH = hour, MM = minute, SS = second
  - Z = UTC timezone

- **Safety**: All rollback instructions include warnings that changes must be reviewed by humans before merging.

- **Cross-Platform**: The Bash script works on Linux/macOS, PowerShell script works on Windows (and Linux/macOS with pwsh).

## REPORT FORMAT

After validation, report results in this format:

```
VALIDATION REPORT
=================

Date: [timestamp]
Branch: copilot/create-rollback-command
Validator: [your name/identifier]

Results:
✅/❌ Files exist and executable
✅/❌ Help functions work
✅/❌ Search functionality works
✅/❌ Detailed token search works
✅/❌ Date search works
✅/❌ Output consistency verified
✅/❌ Error handling verified
✅/❌ PowerShell best practices followed
✅/❌ Documentation complete

Overall: PASS/FAIL

Notes: [any additional observations]
```

---

**END OF VALIDATION PROMPT**

You can copy everything above this line and paste it to any validation agent.
