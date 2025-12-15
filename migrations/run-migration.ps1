# Database Migration Script
# Run this to add country and date_of_birth columns to users table

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$DbHost = "pg-tracklit-dev-kvnx2h.postgres.database.azure.com",
    
    [Parameter(Mandatory=$false)]
    [string]$Database = "tracklit",
    
    [Parameter(Mandatory=$false)]
    [string]$DbUser = "tracklitadmin",
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "5432"
)

Write-Host "=== TrackLit Database Migration ===" -ForegroundColor Cyan
Write-Host "Adding country and date_of_birth columns to users table" -ForegroundColor Cyan
Write-Host ""

# Check if psql is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools" -ForegroundColor Yellow
    Write-Host "Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Migration file path
$migrationFile = Join-Path $PSScriptRoot "add_country_dateofbirth.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration file: $migrationFile" -ForegroundColor Green

# Prompt for password if not using connection string
if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    Write-Host ""
    Write-Host "Database connection details:" -ForegroundColor Yellow
    Write-Host "  Host: $DbHost" -ForegroundColor Gray
    Write-Host "  Database: $Database" -ForegroundColor Gray
    Write-Host "  User: $DbUser" -ForegroundColor Gray
    Write-Host "  Port: $Port" -ForegroundColor Gray
    Write-Host ""
    
    $Password = Read-Host "Enter database password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    $PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Set PGPASSWORD environment variable
    $env:PGPASSWORD = $PlainPassword
    
    Write-Host ""
    Write-Host "Running migration..." -ForegroundColor Yellow
    
    # Run the migration with SSL mode
    $env:PGSSLMODE = "require"
    psql -h $DbHost -U $DbUser -d $Database -p $Port -f $migrationFile
    $env:PGSSLMODE = $null
    
    # Clear password
    $env:PGPASSWORD = $null
    
} else {
    Write-Host "Using DATABASE_URL connection string" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Running migration..." -ForegroundColor Yellow
    
    # Run the migration with connection string
    psql $DatabaseUrl -f $migrationFile
}

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Migration failed with exit code: $exitCode" -ForegroundColor Red
    exit $exitCode
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Build and deploy the updated application" -ForegroundColor White
Write-Host "2. Test the new country and date of birth fields" -ForegroundColor White
Write-Host ""
