# Script to start the React Frontend

Write-Host ">> Setting up Writegy Frontend..." -ForegroundColor Cyan

# Install dependencies if missing
if (-not (Test-Path "node_modules")) {
    Write-Host ">> Installing npm packages (this happens once)..." -ForegroundColor Yellow
    npm install
}

# Start server
Write-Host ">> Starting Vite Server..." -ForegroundColor Green
npm run dev