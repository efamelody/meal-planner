# run.ps1 — Start the Meal Planner backend
# Run this from the repo root: .\run.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── Config ──────────────────────────────────────
$JavaHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$MavenHome = "$HOME\apps\apache-maven-3.9.16"
$Maven = "$MavenHome\bin\mvn.cmd"
# ────────────────────────────────────────────────

# Check Java
$env:JAVA_HOME = $JavaHome
$env:Path = "$MavenHome\bin;$env:Path"

Write-Host "=== Meal Planner Backend ===" -ForegroundColor Cyan
Write-Host " Java: $JavaHome" -ForegroundColor Gray
Write-Host " Maven: $MavenHome" -ForegroundColor Gray
Write-Host ""

# Start backend
Set-Location -LiteralPath "$RepoRoot\backend"
& $Maven spring-boot:run
