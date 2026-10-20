# Makes a real page for every keyboard, category and the About page, so Google
# can find each one, plus sitemap.xml (the list of pages you give to Google).
# deploy.ps1 runs this automatically; you don't need to run it yourself.
#
# Each page is a copy of index.html with its own title, description and a short
# preview of its content. The site's JavaScript then shows the full page as usual.
#
# The folders keyboard\, category\ and about\ are rebuilt every time, so don't
# put your own files in them.

param(
  [string]$SiteUrl = "https://cvcool-eng.github.io/goodkeyboards/"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if (-not $SiteUrl.EndsWith("/")) { $SiteUrl += "/" }
$utf8 = New-Object System.Text.UTF8Encoding $false
$dash = [char]0x2013   # the "–" in page titles (written this way so PowerShell can't garble it)

function Enc([string]$s) { [System.Net.WebUtility]::HtmlEncode($s) }
function Unjs([string]$s) { [regex]::Replace($s, '\\(.)', '$1') }
function JsField([string]$block, [string]$name) {
  $m = [regex]::Match($block, "(?m)^\s{4}${name}:\s*""((?:[^""\\]|\\.)*)""")
  if ($m.Success) { Unjs $m.Groups[1].Value } else { "" }
}

$template = [IO.File]::ReadAllText("$root\index.html")
$js = [IO.File]::ReadAllText("$root\data\keyboards.js")

# Categories: { id: "...", name: "...", blurb: "..." }
$categories = foreach ($m in [regex]::Matches($js, '\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*blurb:\s*"((?:[^"\\]|\\.)*)"\s*\}')) {
  [pscustomobject]@{ id = $m.Groups[1].Value; name = $m.Groups[2].Value; blurb = Unjs $m.Groups[3].Value }
}

# Keyboards: each entry in KEYBOARDS starts with "  {" on its own line
$kbText = $js.Substring($js.IndexOf("const KEYBOARDS"))
$keyboards = foreach ($block in [regex]::Split($kbText, '\r?\n  \{')) {
  $id = JsField $block "id"
  if ($id) {
    [pscustomobject]@{
      id = $id; name = JsField $block "name"; brand = JsField $block "brand"; summary = JsField $block "summary"
    }
  }
}

function Write-Page([string]$path, [string]$base, [string]$title, [string]$description, [string]$preview, [string]$canonical) {
  $html = $template.Replace('<base href="./">', "<base href=""$base"">")
  $html = $html.Replace('<title>GoodKeyboards</title>', "<title>$(Enc $title)</title>`n  <link rel=""canonical"" href=""$canonical"">")
  $html = [regex]::Replace($html, '<meta name="description" content="[^"]*">', "<meta name=""description"" content=""$(Enc $description)"">")
  $html = $html.Replace('<main id="main" tabindex="-1"></main>', "<main id=""main"" tabindex=""-1"">$preview</main>")
  $full = Join-Path $root $path
  New-Item -ItemType Directory -Force (Split-Path $full) | Out-Null
  [IO.File]::WriteAllText($full, $html, $utf8)
}

# Start fresh so removed keyboards don't leave old pages behind
foreach ($dir in "keyboard", "category", "about") {
  if (Test-Path "$root\$dir") { Remove-Item -Recurse -Force "$root\$dir" }
}

$urls = @($SiteUrl, "${SiteUrl}about/")

Write-Page "about\index.html" "../" "About $dash GoodKeyboards" `
  "GoodKeyboards is a showcase of the best gaming keyboards, sorted into simple categories." `
  "<h1>About GoodKeyboards</h1><p>Helping you find the keyboard that fits you.</p>" "${SiteUrl}about/"

foreach ($c in $categories) {
  $url = "${SiteUrl}category/$($c.id)/"
  Write-Page "category\$($c.id)\index.html" "../../" "$($c.name) $dash GoodKeyboards" $c.blurb `
    "<h1>$(Enc $c.name)</h1><p>$(Enc $c.blurb)</p>" $url
  $urls += $url
}

foreach ($k in $keyboards) {
  $url = "${SiteUrl}keyboard/$($k.id)/"
  $full = "$($k.brand) $($k.name)"
  Write-Page "keyboard\$($k.id)\index.html" "../../" "$full $dash GoodKeyboards" `
    "$($k.summary) See specs, a YouTube review and where to buy the $full." `
    "<h1>$(Enc $full)</h1><p>$(Enc $k.summary)</p>" $url
  $urls += $url
}

# 404 page: unknown addresses show the home page (absolute base works at any depth)
$basePath = ([Uri]$SiteUrl).AbsolutePath
$notFound = $template.Replace('<base href="./">', "<base href=""$basePath"">")
[IO.File]::WriteAllText("$root\404.html", $notFound, $utf8)

# sitemap.xml
$today = Get-Date -Format "yyyy-MM-dd"
$entries = ($urls | ForEach-Object { "  <url><loc>$_</loc><lastmod>$today</lastmod></url>" }) -join "`n"
$sitemap = "<?xml version=""1.0"" encoding=""UTF-8""?>`n<urlset xmlns=""http://www.sitemaps.org/schemas/sitemap/0.9"">`n$entries`n</urlset>`n"
[IO.File]::WriteAllText("$root\sitemap.xml", $sitemap, $utf8)

Write-Host "Built $($keyboards.Count) keyboard pages, $($categories.Count) category pages, About page, 404 page and sitemap.xml."
