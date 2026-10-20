# Publishes this folder to GitHub Pages.
# Usage (from this folder, in PowerShell):
#   powershell -ExecutionPolicy Bypass -File .\deploy.ps1
#   powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Repo goodkeyboards -Message "Add new keyboards"
#
# First-time setup:
#   winget install --id Git.Git -e
#   winget install --id GitHub.cli -e
#   (close and reopen PowerShell, then)
#   gh auth login

param(
  [string]$Repo = "goodkeyboards",
  [string]$Message = "Update site"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

foreach ($tool in "git", "gh") {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    Write-Host "$tool is not installed. See the setup steps at the top of deploy.ps1." -ForegroundColor Red
    exit 1
  }
}

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "You're not signed in to GitHub. Run: gh auth login" -ForegroundColor Red
  exit 1
}

$owner = gh api user --jq .login
Write-Host "GitHub user: $owner"

# 1. Local git repo
if (-not (Test-Path ".git")) {
  git init -b main | Out-Null
  Write-Host "Created local git repository."
}
if (-not (git config user.name))  { git config user.name $owner }
if (-not (git config user.email)) { git config user.email "$owner@users.noreply.github.com" }

# 2. Commit changes
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m $Message | Out-Null
  Write-Host "Committed changes."
} else {
  Write-Host "No new changes to commit."
}

# 3. Create GitHub repo (first run only) and push
git remote get-url origin *> $null
if ($LASTEXITCODE -ne 0) {
  gh repo create "$owner/$Repo" --public --source . --remote origin --push
} else {
  git push -u origin main
}
if ($LASTEXITCODE -ne 0) { Write-Host "Push failed." -ForegroundColor Red; exit 1 }

# 4. Turn on GitHub Pages (first run only)
gh api "repos/$owner/$Repo/pages" *> $null
if ($LASTEXITCODE -ne 0) {
  gh api -X POST "repos/$owner/$Repo/pages" -f "source[branch]=main" -f "source[path]=/" | Out-Null
  Write-Host "Enabled GitHub Pages."
}

$url = gh api "repos/$owner/$Repo/pages" --jq .html_url
Write-Host ""
Write-Host "Done! Your site will be live in about a minute at:" -ForegroundColor Green
Write-Host "  $url" -ForegroundColor Green
