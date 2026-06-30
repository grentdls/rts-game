param(
  [Parameter(Mandatory = $true)]
  [string]$RepositoryUrl
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
  git init -b main
}

$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
  git branch -M main
}

$remoteExists = git remote | Where-Object { $_ -eq "origin" }
if ($remoteExists) {
  git remote set-url origin $RepositoryUrl
} else {
  git remote add origin $RepositoryUrl
}

git add index.html styles.css game.js README.md DEPLOY_GITHUB_PAGES.md publish-github-pages.ps1 .gitignore .nojekyll
git commit -m "Publish browser RTS game" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "No new commit was created. Continuing with push."
}

git push -u origin main

Write-Host ""
Write-Host "Push complete."
Write-Host "Now open the GitHub repository: Settings -> Pages -> Deploy from a branch -> main -> /(root)."

