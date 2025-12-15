# Database Migration Script using Azure CLI
# This script uses Azure CLI to connect without needing the password

Write-Host "=== TrackLit Database Migration ===" -ForegroundColor Cyan
Write-Host "Adding country and date_of_birth columns to users table" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
$azPath = Get-Command az -ErrorAction SilentlyContinue
if (-not $azPath) {
    Write-Host "ERROR: Azure CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Azure CLI from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Migration file path
$migrationFile = Join-Path $PSScriptRoot "add_country_dateofbirth.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration file: $migrationFile" -ForegroundColor Green
Write-Host ""

# Database details
$resourceGroup = "rg-tracklit-dev"
$serverName = "pg-tracklit-dev-kvnx2h"
$database = "tracklit"
$adminUser = "tracklitadmin"

Write-Host "Connecting to Azure PostgreSQL server..." -ForegroundColor Yellow
Write-Host "  Resource Group: $resourceGroup" -ForegroundColor Gray
Write-Host "  Server: $serverName" -ForegroundColor Gray
Write-Host "  Database: $database" -ForegroundColor Gray
Write-Host ""

# Read the SQL file content
$sqlContent = Get-Content $migrationFile -Raw

# Execute using az postgres flexible-server execute
Write-Host "Running migration..." -ForegroundColor Yellow
Write-Host ""

try {
    # Save SQL to temp file for az command
    $tempFile = [System.IO.Path]::GetTempFileName()
    $sqlContent | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
    
    # Execute the SQL
    az postgres flexible-server execute `
        --name $serverName `
        --admin-user $adminUser `
        --database-name $database `
        --file-path $tempFile `
        --output table
    
    $exitCode = $LASTEXITCODE
    
    # Clean up temp file
    Remove-Item $tempFile -Force
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Migration failed with exit code: $exitCode" -ForegroundColor Red
        exit $exitCode
    }
    
} catch {
    Write-Host "✗ Error running migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Verifying migration..." -ForegroundColor Yellow

# Verify the columns exist
$verifySQL = @"
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('country', 'date_of_birth')
ORDER BY column_name;
"@

$tempVerifyFile = [System.IO.Path]::GetTempFileName()
$verifySQL | Out-File -FilePath $tempVerifyFile -Encoding utf8 -NoNewline

az postgres flexible-server execute `
    --name $serverName `
    --admin-user $adminUser `
    --database-name $database `
    --file-path $tempVerifyFile `
    --output table

Remove-Item $tempVerifyFile -Force

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Build and deploy the updated application" -ForegroundColor White
Write-Host "2. Test the new country and date of birth fields" -ForegroundColor White
Write-Host ""
