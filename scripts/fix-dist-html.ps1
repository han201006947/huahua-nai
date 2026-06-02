# Post-build: strip module attrs and move app.js before </body> (sync in head runs before #app exists = blank page)
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$IndexPath = Join-Path $ProjectRoot 'dist\index.html'

if (-not (Test-Path $IndexPath)) {
    throw "dist/index.html not found"
}

$html = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8
$html = $html -replace '\s*type="module"', ''
$html = $html -replace '\s*crossorigin', ''

$scriptPattern = '<script\s+src="\./assets/app\.js"\s*></script>'
$scriptMatch = [regex]::Match($html, $scriptPattern)
if ($scriptMatch.Success) {
    $scriptTag = $scriptMatch.Value
    $html = [regex]::Replace($html, $scriptPattern, '', 1)
    $html = $html -replace '(<div id="app"></div>)', "`$1`n    $scriptTag"
}

[System.IO.File]::WriteAllText($IndexPath, $html, [System.Text.UTF8Encoding]::new($false))

Write-Host '>> fixed dist/index.html: app.js at end of body for file:// and Netlify'
