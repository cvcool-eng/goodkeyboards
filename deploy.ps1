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

# Native tools (git, gh) report problems through exit codes, checked below.
$ErrorActionPreference = "Continue"
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
# If anything changed, give the CSS/JS links a new ?v= number so browsers
# download the new files instead of using old saved copies.
if (git status --porcelain) {
  $version = Get-Date -Format "yyyyMMddHHmmss"
  $html = [IO.File]::ReadAllText("$PSScriptRoot\index.html")
  $html = [regex]::Replace($html, '\?v=[0-9]+"', "?v=$version`"")
  [IO.File]::WriteAllText("$PSScriptRoot\index.html", $html)
}

# Build a real page for every keyboard and category (so Google can find them) and sitemap.xml
$siteUrl = gh api "repos/$owner/$Repo/pages" --jq .html_url 2>$null
if ($siteUrl -notmatch '^https?://') { $siteUrl = "https://$owner.github.io/$Repo/" }
try {
  & "$PSScriptRoot\build-pages.ps1" -SiteUrl $siteUrl
} catch {
  Write-Host "Building pages failed: $_" -ForegroundColor Red
  exit 1
}

git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m $Message | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Host "Commit failed." -ForegroundColor Red; exit 1 }
  Write-Host "Committed changes."
} else {
  Write-Host "No new changes to commit."
}

# 3. Create GitHub repo (first run only) and push
if ((git remote) -notcontains "origin") {
  gh repo create "$owner/$Repo" --public --source . --remote origin --push
} else {
  git push -u origin main
}
if ($LASTEXITCODE -ne 0) { Write-Host "Push failed." -ForegroundColor Red; exit 1 }

# 4. Turn on GitHub Pages (first run only)
gh api "repos/$owner/$Repo/pages" *> $null
if ($LASTEXITCODE -ne 0) {
  gh api -X POST "repos/$owner/$Repo/pages" -f "source[branch]=main" -f "source[path]=/" | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Host "Could not turn on GitHub Pages." -ForegroundColor Red; exit 1 }
  Write-Host "Enabled GitHub Pages."
}

$url = gh api "repos/$owner/$Repo/pages" --jq .html_url
Write-Host ""
Write-Host "Done! Your site will be live in about a minute at:" -ForegroundColor Green
Write-Host "  $url" -ForegroundColor Green
