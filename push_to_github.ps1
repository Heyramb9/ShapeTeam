# push_to_github.ps1
# Run this script from d:\Shapteam after PortableGit is extracted
# Usage: .\push_to_github.ps1

$GIT = "$env:USERPROFILE\PortableGit\bin\git.exe"
$REMOTE = "https://github.com/Heyramb9/ShapeTeam.git"
$BRANCH = "main"

Write-Host "=== ShapeTeam GitHub Push Script ===" -ForegroundColor Cyan

# Check git exists
if (-not (Test-Path $GIT)) {
    Write-Host "ERROR: Portable Git not found at $GIT" -ForegroundColor Red
    Write-Host "Run the PortableGit installer first: $env:USERPROFILE\PortableGit.exe" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/6] Initialising git repo..." -ForegroundColor Green
& $GIT init

Write-Host "[2/6] Configuring identity..." -ForegroundColor Green
& $GIT config user.name "Heyramb9"
& $GIT config user.email "heyramb9@users.noreply.github.com"

Write-Host "[3/6] Adding remote origin..." -ForegroundColor Green
$remoteExists = & $GIT remote get-url origin 2>$null
if (-not $remoteExists) {
    & $GIT remote add origin $REMOTE
} else {
    & $GIT remote set-url origin $REMOTE
}

Write-Host "[4/6] Staging all files..." -ForegroundColor Green
& $GIT add .

Write-Host "[5/6] Committing..." -ForegroundColor Green
& $GIT commit -m "Initial commit: ShapeTeam hybrid AI workforce optimization platform"

Write-Host "[6/6] Pushing to GitHub ($BRANCH)..." -ForegroundColor Green
& $GIT branch -M $BRANCH
& $GIT push -u origin $BRANCH

Write-Host ""
Write-Host "Done! Code is now live at: https://github.com/Heyramb9/ShapeTeam" -ForegroundColor Cyan
