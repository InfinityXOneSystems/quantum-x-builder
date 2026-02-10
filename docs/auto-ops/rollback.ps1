##############################################################################
# Rollback Helper Script (PowerShell)
# Finds commits with rollback tokens and provides guidance for creating
# revert branches and PRs. All rollbacks require human review before merge.
##############################################################################

param(
    [string]$Token = "",
    [string]$Date = "",
    [int]$Limit = 10,
    [switch]$Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-Usage {
    Write-Host @"
Usage: .\rollback.ps1 [options]

Options:
  -Token TOKEN    Find specific rollback token (e.g., qxb-rollback-20260208T143022Z)
  -Date DATE      Find rollback tokens by date (e.g., 20260208)
  -Limit LIMIT    Limit number of results (default: 10)
  -Help           Show this help message

Examples:
  .\rollback.ps1 -Token qxb-rollback-20260208T143022Z
  .\rollback.ps1 -Date 20260208
  .\rollback.ps1 -Limit 20
"@
    exit 0
}

function Write-Info($message) {
    Write-Host $message -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host $message -ForegroundColor Green
}

function Write-WarnMessage($message) {
    Write-Host $message -ForegroundColor Yellow
}

function Write-ErrorMessage($message) {
    Write-Host $message -ForegroundColor Red
}

# Show help if requested
if ($Help) {
    Show-Usage
}

Write-Info "🔄 QXB Rollback Helper"
Write-Info "===================="
Write-Host ""

# Build search pattern
$searchPattern = ""
if ($Token) {
    $searchPattern = $Token
    Write-Info "🔍 Searching for rollback token: $Token"
} elseif ($Date) {
    $searchPattern = "qxb-rollback-$Date"
    Write-Info "🔍 Searching for rollback tokens on date: $Date"
} else {
    $searchPattern = "qxb-rollback-"
    Write-Info "🔍 Searching for all rollback tokens (limit: $Limit)"
}

Write-Host ""

# Find commits with rollback tokens
try {
    $commits = git log --all --grep="$searchPattern" --oneline --max-count=$Limit 2>&1
    
    if ($LASTEXITCODE -ne 0 -or -not $commits) {
        Write-ErrorMessage "❌ No commits found matching pattern: $searchPattern"
        exit 1
    }
    
    # Convert to array if it's a single string
    if ($commits -is [string]) {
        $commits = @($commits)
    }
    
    Write-Success "📋 Found commits with rollback tokens:"
    $commits | ForEach-Object { Write-Host $_ }
    Write-Host ""
    
    # If specific token, provide detailed rollback instructions
    if ($Token) {
        $firstCommit = $commits[0]
        $commitSha = ($firstCommit -split ' ')[0]
        
        Write-Info "📝 Rollback Instructions for $Token"
        Write-Info "======================================"
        Write-Host ""
        Write-Host "1. Review the commit details:"
        Write-Host "   git show $commitSha"
        Write-Host ""
        Write-Host "2. Create a revert commit:"
        Write-Host "   git revert $commitSha"
        Write-Host ""
        Write-Host "3. Create a new branch for the rollback:"
        Write-Host '   $branchName = "rollback/revert-' -NoNewline
        Write-Host "$Token" -NoNewline
        Write-Host '"'
        Write-Host '   git checkout -b $branchName'
        Write-Host ""
        Write-Host "4. Push the rollback branch:"
        Write-Host '   git push origin $branchName'
        Write-Host ""
        Write-Host "5. Create a PR for human review:"
        Write-Host "   gh pr create --title `"Rollback: revert $Token`" --body `"Reverting automated changes from rollback token $Token. Requires human review.`""
        Write-Host ""
        Write-WarnMessage "⚠️  IMPORTANT: Do NOT merge without human review!"
        Write-Host ""
        
        # Show commit details
        Write-Info "📄 Commit Details:"
        git show --stat $commitSha
    } else {
        Write-Info "💡 To get detailed rollback instructions for a specific commit, run:"
        Write-Host "   .\rollback.ps1 -Token <rollback-token>"
        Write-Host ""
        Write-Host "Example:"
        
        $firstCommit = $commits[0]
        $firstSha = ($firstCommit -split ' ')[0]
        $firstMsg = ($firstCommit -split ' ', 2)[1]
        
        # Extract token from commit message
        if ($firstMsg -match '(qxb-rollback-\d{8}T\d{6}Z)') {
            $exampleToken = $matches[1]
            Write-Host "   .\rollback.ps1 -Token $exampleToken"
        }
    }
    
    Write-Host ""
    Write-Success "✅ Rollback helper completed"
    exit 0
    
} catch {
    Write-ErrorMessage "❌ Error executing git command: $_"
    exit 1
}
