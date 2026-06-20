# run-frontend.ps1 — Start the Meal Planner frontend
# Run this in a SEPARATE terminal from run.ps1
# Open http://localhost:4200 in your browser once it's ready

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Meal Planner Frontend ===" -ForegroundColor Cyan
Write-Host " Open: http://localhost:4200" -ForegroundColor Gray
Write-Host ""

Set-Location -LiteralPath "$RepoRoot\frontend"
ng serve
