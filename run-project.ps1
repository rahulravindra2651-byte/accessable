# PowerShell script to run both backend and frontend for AccessAble
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $projectRoot) { $projectRoot = Get-Location }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AccessAble — Starting Local Services  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Start Backend in a background process
Write-Host "`n[1/2] Starting backend on http://localhost:5000..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; Write-Host '--- AccessAble Backend Server ---' -ForegroundColor Cyan; npm start" -PassThru

# 2. Start Frontend
Write-Host "[2/2] Starting frontend on http://localhost:3000..." -ForegroundColor Green
cd "$projectRoot"
npm run dev:frontend