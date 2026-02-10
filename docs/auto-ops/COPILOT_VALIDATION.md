# Quick Validation Prompt for Copilot

**Copy this entire message and paste to Copilot:**

---

Hey Copilot! Please validate the rollback helper scripts I just created.

**Scripts to test:**
- `docs/auto-ops/rollback.sh` (Bash)
- `docs/auto-ops/rollback.ps1` (PowerShell)

**What they do:** Search git history for commits with rollback tokens (`qxb-rollback-YYYYMMDDTHHMMSSZ`) and provide revert instructions.

**Test commands:**

```bash
# 1. Check files exist
ls -la docs/auto-ops/rollback.*

# 2. Test help
cd docs/auto-ops
./rollback.sh -h
pwsh -File rollback.ps1 -Help

# 3. Test search (no results expected if no tokens exist)
./rollback.sh -l 5
pwsh -File rollback.ps1 -Limit 5

# 4. Create test repo with rollback token
mkdir -p /tmp/rollback-test && cd /tmp/rollback-test
git init
git config user.email "test@example.com"
git config user.name "Test User"
echo "test" > test.txt
git add test.txt
git commit -m "Test commit qxb-rollback-20260209T100000Z"

# 5. Test both scripts find the token
bash /home/runner/work/quantum-x-builder/quantum-x-builder/docs/auto-ops/rollback.sh -l 1
pwsh -File /home/runner/work/quantum-x-builder/quantum-x-builder/docs/auto-ops/rollback.ps1 -Limit 1

# 6. Test detailed token search
bash /home/runner/work/quantum-x-builder/quantum-x-builder/docs/auto-ops/rollback.sh -t qxb-rollback-20260209T100000Z
pwsh -File /home/runner/work/quantum-x-builder/quantum-x-builder/docs/auto-ops/rollback.ps1 -Token qxb-rollback-20260209T100000Z

# 7. Test date search
bash /home/runner/work/quantum-x-builder/quantum-x-builder/docs/auto-ops/rollback.sh -d 20260209
pwsh -File /home/runner/work/quantum-x-builder/quantum-x-builder/docs/auto-ops/rollback.ps1 -Date 20260209
```

**Verify:**
- ✅ Both scripts produce similar output
- ✅ Help shows usage and examples
- ✅ Search finds rollback tokens correctly
- ✅ Detailed token search shows step-by-step revert instructions
- ✅ Date search works
- ✅ No crashes or errors
- ✅ PowerShell script uses `Write-ErrorMessage` not `Write-Error`

**Expected detailed output includes:**
1. Commit SHA and message
2. Instructions: `git show`, `git revert`, branch creation, push, PR creation
3. Warning: "Do NOT merge without human review"

Please run these tests and confirm everything works! Let me know if you find any issues.

---

**That's it!** Just copy everything between the dashes and send to Copilot.
