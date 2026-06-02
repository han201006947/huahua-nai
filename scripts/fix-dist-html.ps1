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

# 构建时间戳：追加到 js/css 查询参数，避免 GitHub Pages CDN 长期缓存旧 app.js
$buildVer = Get-Date -Format 'yyyyMMddHHmmss'
$cssHref = './assets/style.css?v=' + $buildVer
$jsSrc = './assets/app.js?v=' + $buildVer

# 样式表加版本号，部署后顾客能立刻看到新样式
$html = $html -replace 'href="\./assets/style\.css(?:\?v=[^"]*)?"', ('href="{0}"' -f $cssHref)

# 从 head 取出 app.js，改写到 #app 之后（带版本号）
$scriptPattern = '<script\s+[^>]*src="\./assets/app\.js[^"]*"[^>]*>\s*</script>'
$scriptMatch = [regex]::Match($html, $scriptPattern)
if ($scriptMatch.Success) {
    $scriptTag = '<script src="' + $jsSrc + '"></script>'
    $html = [regex]::Replace($html, $scriptPattern, '', 1)
    $html = $html -replace '(<div id="app"></div>)', ('$1' + "`n    " + $scriptTag)
}

[System.IO.File]::WriteAllText($IndexPath, $html, [System.Text.UTF8Encoding]::new($false))

Write-Host ('>> fixed dist/index.html: app.js at end of body, cache bust v=' + $buildVer)
