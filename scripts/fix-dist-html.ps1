# Post-build: strip module attrs, defer app.js（中文占位由 inject-site-url.mjs 写入）
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$IndexPath = Join-Path $ProjectRoot 'dist\index.html'

if (-not (Test-Path $IndexPath)) {
    throw "dist/index.html not found"
}

$html = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8
$html = $html -replace '\s*type="module"', ''
$html = $html -replace '\s*crossorigin', ''

$buildVer = Get-Date -Format 'yyyyMMddHHmmss'
$cssHref = './assets/style.css?v=' + $buildVer
$jsSrc = './assets/app.js?v=' + $buildVer

$html = $html -replace 'href="\./assets/style\.css(?:\?v=[^"]*)?"', ('href="{0}"' -f $cssHref)

$scriptPattern = '<script\s+[^>]*src="\./assets/app\.js[^"]*"[^>]*>\s*</script>'
$html = [regex]::Replace($html, $scriptPattern, '')

$scriptTag = '<script defer src="' + $jsSrc + '"></script>'
$html = $html -replace '<div id="app"></div>', ('<div id="app"></div>' + [Environment]::NewLine + '    ' + $scriptTag)

[System.IO.File]::WriteAllText($IndexPath, $html, [System.Text.UTF8Encoding]::new($false))

Write-Host ('>> fixed dist/index.html: defer app.js v=' + $buildVer)
