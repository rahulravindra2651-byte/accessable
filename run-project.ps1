# PowerShell script to run both backend and frontend for AccessAble
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AccessAble - Starting Local Services  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Start Backend in a separate window
Write-Host "`n[1/2] Starting backend on http://localhost:5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; Write-Host '--- AccessAble Backend Server ---' -ForegroundColor Cyan; npm start"

# 2. Start Frontend in the current window
Write-Host "[2/2] Starting frontend on http://localhost:3000..." -ForegroundColor Green
Set-Location $root
npm run dev:frontend