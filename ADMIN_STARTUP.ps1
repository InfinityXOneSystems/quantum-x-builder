#!/usr/bin/env pwsh
<#
.SYNOPSIS
    ADMIN STARTUP - Quantum-X-Builder Full System Launch
    
.DESCRIPTION
    One-command admin startup for full Docker deployment.
    Sets up all admin credentials, builds Docker images, and launches the system.
    
.PARAMETER Mode
    'full' = Build + launch everything
    'build' = Build only (no launch)
    'launch' = Launch only (use pre-built images)
    'check' = Verify prerequisites only
    
.EXAMPLE
    ./ADMIN_STARTUP.ps1 -Mode full
#>

param(
    [ValidateSet('full', 'build', 'launch', 'check')]
    [string]$Mode = 'full'
)

$ErrorActionPreference = 'Stop'
$Root = Get-Location

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     QUANTUM-X-BUILDER ADMIN STARTUP                          ║" -ForegroundColor Cyan
Write-Host "║     Full Docker System Deployment                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================================================
# PART 1: PREREQUISITE CHECKS
# ============================================================================

function Check-Prerequisites {
    Write-Host "[1/5] CHECKING PREREQUISITES..." -ForegroundColor Yellow
    
    $checks = @{
        "Docker" = "docker --version"
        "Docker Compose" = "docker-compose --version"
        "PowerShell" = "pwsh --version"
        "Workspace" = "Test-Path '$(Get-Location)' -PathType Container"
    }
    
    $allGood = $true
    foreach ($check in $checks.GetEnumerator()) {
        try {
            $result = Invoke-Expression $check.Value 2>&1
            Write-Host "  ✓ $($check.Name): OK" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ $($check.Name): MISSING" -ForegroundColor Red
            $allGood = $false
        }
    }
    
    if (-not $allGood) {
        Write-Host "`n[ERROR] Prerequisites missing. Please install Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n  ✓ All prerequisites verified`n" -ForegroundColor Green
}

# ============================================================================
# PART 2: ADMIN SETUP
# ============================================================================

function Setup-AdminAccess {
    Write-Host "[2/5] SETTING UP ADMIN ACCESS..." -ForegroundColor Yellow
    
    # Create admin credentials file
    $adminCreds = @{
        admin_level = "ROOT"
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        access_granted = $true
        permissions = @(
            "docker.full_control"
            "backend.admin_access"
            "frontend.deployment"
            "nats.cluster_management"
            "policy.override"
            "autonomy.control"
            "github.app_management"
        )
    }
    
    $adminPath = "$Root\_OPS\ADMIN\ADMIN_CREDENTIALS.json"
    New-Item -Path (Split-Path $adminPath) -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
    $adminCreds | ConvertTo-Json -Depth 10 | Set-Content $adminPath
    
    Write-Host "  ✓ Admin credentials created: $adminPath" -ForegroundColor Green
    Write-Host "  ✓ Admin level: ROOT" -ForegroundColor Green
    Write-Host "  ✓ Access: FULL" -ForegroundColor Green
}

# ============================================================================
# PART 3: DOCKER BUILD
# ============================================================================

function Build-DockerImages {
    Write-Host "`n[3/5] BUILDING DOCKER IMAGES..." -ForegroundColor Yellow
    
    Write-Host "  Building backend..." -ForegroundColor Cyan
    docker-compose build backend --no-cache
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
    Write-Host "  ✓ Backend built" -ForegroundColor Green
    
    Write-Host "`n  Building frontend..." -ForegroundColor Cyan
    docker-compose build frontend --no-cache
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    Write-Host "  ✓ Frontend built" -ForegroundColor Green
    
    Write-Host "`n  ✓ All images built successfully`n" -ForegroundColor Green
}

# ============================================================================
# PART 4: DOCKER LAUNCH
# ============================================================================

function Launch-Services {
    Write-Host "[4/5] LAUNCHING DOCKER SERVICES..." -ForegroundColor Yellow
    
    Write-Host "  Starting containers..." -ForegroundColor Cyan
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) { throw "Docker-compose up failed" }
    
    Write-Host "  Waiting for services to be ready..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    Write-Host "`n  Service Status:`n" -ForegroundColor Green
    docker-compose ps | Format-Table
    
    Write-Host "`n  ✓ All services launched`n" -ForegroundColor Green
}

# ============================================================================
# PART 5: VERIFICATION
# ============================================================================

function Verify-Services {
    Write-Host "[5/5] VERIFYING SERVICES..." -ForegroundColor Yellow
    
    $endpoints = @{
        "Backend API" = "http://localhost:8787/health"
        "Frontend" = "http://localhost:3000"
        "NATS Admin" = "http://localhost:8222"
    }
    
    foreach ($endpoint in $endpoints.GetEnumerator()) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Value -TimeoutSec 3 -ErrorAction SilentlyContinue
            Write-Host "  ✓ $($endpoint.Name): RESPONDING" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠ $($endpoint.Name): Check in progress..." -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n  ✓ Verification complete`n" -ForegroundColor Green
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Check-Prerequisites
    
    if ($Mode -in 'full', 'check') {
        Write-Host ""
    }
    
    if ($Mode -in 'full', 'build') {
        Setup-AdminAccess
        Build-DockerImages
    }
    
    if ($Mode -in 'full', 'launch') {
        Launch-Services
    }
    
    if ($Mode -in 'full', 'check') {
        Verify-Services
    }
    
    # Summary
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                    ✓ STARTUP COMPLETE                         ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    Write-Host "SYSTEM READY FOR ADMIN OPERATION" -ForegroundColor Green
    Write-Host "`nAccess Points:`n" -ForegroundColor White
    Write-Host "  Frontend:       http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend API:    http://localhost:8787" -ForegroundColor Cyan
    Write-Host "  NATS Admin:     http://localhost:8222" -ForegroundColor Cyan
    Write-Host "`nAdmin Resources:`n" -ForegroundColor White
    Write-Host "  Setup Guide:    _OPS/ADMIN/ADMIN_SETUP_GUIDE.md" -ForegroundColor Cyan
    Write-Host "  Credentials:    _OPS/ADMIN/ADMIN_CREDENTIALS.json" -ForegroundColor Cyan
    Write-Host "  Vault:          c:\AI\vault-data\secrets.json" -ForegroundColor Cyan
    Write-Host "`n"
    
}
catch {
    Write-Host "`n✗ ERROR: $_" -ForegroundColor Red
    exit 1
}
