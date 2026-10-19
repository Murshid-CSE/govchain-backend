<#
.SYNOPSIS
    Secure staging migration script for GovChain using direct Neon PostgreSQL.
.DESCRIPTION
    Prompts for the Neon staging connection URL using hidden input (no echo).
    Validates TLS requirement, Neon domain, and direct (non-pooled) connection endpoint.
    Requires explicit operator confirmation before applying committed Prisma migrations.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ConnectionUrl,

    [Parameter(Mandatory = $false)]
    [switch]$SkipConfirmation
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   GovChain Staging Database Migration Helper (Neon)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This helper applies committed Prisma migrations to your"
Write-Host "remote Neon staging database without exposing credentials in chat/history."
Write-Host ""

# 1. Obtain Connection URL (Prompt with secure masked input if not passed via parameter)
$rawUrl = $ConnectionUrl

if (-not $rawUrl) {
    $securePrompt = Read-Host -Prompt "Enter direct Neon staging connection URL (hidden)" -AsSecureString

    if (-not $securePrompt) {
        Write-Error "No connection URL was provided. Migration aborted."
        exit 1
    }

    $cred = [System.Management.Automation.PsCredential]::new('db', $securePrompt)
    $rawUrl = $cred.GetNetworkCredential().Password
}

# 2. Strict Validation
try {
    if (-not ($rawUrl.StartsWith("postgresql://") -or $rawUrl.StartsWith("postgres://"))) {
        throw "URL must start with 'postgresql://' or 'postgres://'."
    }

    $uri = [System.Uri]$rawUrl

    if ($uri.Host -in @("localhost", "127.0.0.1", "::1")) {
        throw "URL targets localhost. This script is intended strictly for remote Neon staging."
    }

    if (-not ($uri.Host.EndsWith("neon.tech") -or $uri.Host.Contains(".neon."))) {
        throw "Host '$($uri.Host)' does not appear to be a Neon PostgreSQL instance (*.neon.tech)."
    }

    if ($uri.Host.Contains("-pooler.")) {
        throw "URL uses the PgBouncer pooler endpoint ('-pooler'). Prisma migrations require a direct connection endpoint. Please use the non-pooled connection URL from your Neon console."
    }

    if (-not ($rawUrl -match "sslmode=require")) {
        throw "Connection URL must include 'sslmode=require' for encrypted transport."
    }

    $dbName = $uri.AbsolutePath.TrimStart('/')
    if (-not $dbName) {
        throw "Database name missing from connection URL."
    }

    Write-Host ""
    Write-Host "[OK] Connection URL format validated successfully." -ForegroundColor Green
    Write-Host "     Target Host : $($uri.Host)" -ForegroundColor Yellow
    Write-Host "     Target Port : $($uri.Port)" -ForegroundColor Yellow
    Write-Host "     Database    : $dbName" -ForegroundColor Yellow
    Write-Host "     Transport   : TLS (sslmode=require)" -ForegroundColor Yellow
    Write-Host ""

} catch {
    Write-Error "Connection validation failed: $_"
    $rawUrl = $null
    exit 1
}

# 3. Explicit Operator Confirmation
if (-not $SkipConfirmation) {
    Write-Host "CAUTION: This will apply pending database migrations to the remote database." -ForegroundColor Yellow
    $confirm = Read-Host "Type 'YES' to proceed with 'prisma migrate deploy'"

    if ($confirm -cne "YES") {
        Write-Host "Migration cancelled by user." -ForegroundColor Red
        $rawUrl = $null
        exit 0
    }
}

# 4. Execute Migration
Write-Host ""
Write-Host "Executing 'npx prisma migrate deploy'..." -ForegroundColor Cyan

try {
    $env:DATABASE_URL = $rawUrl
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        throw "'npx prisma migrate deploy' failed with exit code $LASTEXITCODE."
    }
    Write-Host ""
    Write-Host "[OK] Prisma migrations applied successfully to staging database!" -ForegroundColor Green
} catch {
    Write-Error "Migration execution failed: $_"
    $rawUrl = $null
    exit 1
} finally {
    $env:DATABASE_URL = ""
}

# 5. Optional Synthetic Baseline Seeding
if (-not $SkipConfirmation) {
    Write-Host ""
    Write-Host "Would you like to seed synthetic baseline data (departments, demo issues, sample tenders)?"
    $seedConfirm = Read-Host "Type 'SEED' to run synthetic seed, or press Enter to skip"

    if ($seedConfirm -ceq "SEED") {
        Write-Host "Seeding synthetic staging data..." -ForegroundColor Cyan
        try {
            $env:DATABASE_URL = $rawUrl
            $env:ALLOW_STAGING_SEED = "true"
            node prisma/seed.js
            if ($LASTEXITCODE -ne 0) {
                throw "'node prisma/seed.js' failed with exit code $LASTEXITCODE."
            }
            Write-Host ""
            Write-Host "[OK] Synthetic staging data seeded successfully!" -ForegroundColor Green
        } catch {
            Write-Error "Seeding failed: $_"
            $rawUrl = $null
            exit 1
        } finally {
            $env:DATABASE_URL = ""
            $env:ALLOW_STAGING_SEED = ""
        }
    } else {
        Write-Host "Seeding skipped." -ForegroundColor Gray
    }
}

$rawUrl = $null
Write-Host ""
Write-Host "Staging database preparation complete." -ForegroundColor Green
