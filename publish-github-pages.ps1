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

$deployPath = Join-Path (Get-Location).Path "_gh_pages_worktree"
if (Test-Path -LiteralPath $deployPath) {
  throw "Temporary deployment worktree already exists: $deployPath"
}

try {
  $hasGhPages = git ls-remote --heads origin gh-pages
  if ($hasGhPages) {
    git worktree add -B gh-pages $deployPath origin/gh-pages
  } else {
    git worktree add --orphan -b gh-pages $deployPath
  }

  Copy-Item -LiteralPath index.html,styles.css,game.js,.nojekyll -Destination $deployPath -Force
  Push-Location $deployPath
  git add index.html styles.css game.js .nojekyll
  git commit -m "Publish static site" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "No website changes were committed. Continuing."
  }
  git push -u origin gh-pages
  Pop-Location
} finally {
  if ((Get-Location).Path -eq $deployPath) {
    Pop-Location
  }
  git worktree remove $deployPath --force 2>$null
}

Write-Host ""
Write-Host "Push complete."
Write-Host "GitHub Pages URL: https://grentdls.github.io/rts-game/"
