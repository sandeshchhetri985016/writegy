# Script to load .env variables and start the application

$envFile = ".env"

if (Test-Path $envFile) {
    Write-Host "Loading environment variables from $envFile..." -ForegroundColor Cyan
    Get-Content $envFile | Where-Object { $_ -match '=' -and -not ($_ -match '^\s*#') } | ForEach-Object {
        $key, $value = $_ -split '=', 2
        # Remove potential quotes around value and whitespace
        $value = $value.Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($key.Trim(), $value)
    }
} else {
    Write-Host "No .env file found. Using default/system environment variables." -ForegroundColor Yellow
}

mvn clean spring-boot:run

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Application crashed! Check the logs above for the error." -ForegroundColor Red
    exit $LASTEXITCODE
}