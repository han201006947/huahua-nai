# Build share zip: exclude large videos so free hosts may accept upload
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectRoot 'dist'
$ShareDir = Join-Path $ProjectRoot 'release\dist-share'
$ReleaseDir = Join-Path $ProjectRoot 'release'
$ZipPath = Join-Path $ReleaseDir 'website-upload.zip'
$UpmaUrl = 'https://www.upma.cn/'

if (-not (Test-Path (Join-Path $DistDir 'index.html'))) {
    Write-Host '>> dist missing, running npm run build ...'
    Push-Location $ProjectRoot
    npm run build | Out-Host
    Pop-Location
}

if (Test-Path $ShareDir) {
    Remove-Item -LiteralPath $ShareDir -Recurse -Force
}
New-Item -ItemType Directory -Path $ShareDir -Force | Out-Null

Write-Host '>> copy dist without .mp4/.mov/.webm (smaller zip for free hosting) ...'
robocopy $DistDir $ShareDir /E /XF *.mp4 *.mov *.webm /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }

if (-not (Test-Path $ReleaseDir)) {
    New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
}
if (Test-Path $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
}
Compress-Archive -Path (Join-Path $ShareDir '*') -DestinationPath $ZipPath -Force

$ZipMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host ">> zip ready: $ZipMb MB -> $ZipPath"

Start-Process explorer.exe -ArgumentList "/select,`"$ZipPath`""
Start-Process $UpmaUrl

Write-Host ''
Write-Host '============================================'
Write-Host ' DO NOT pay Tiiny Pro - your site is too large'
Write-Host '============================================'
Write-Host "Zip size: $ZipMb MB (videos removed)"
Write-Host '1. Close Tiiny payment page'
Write-Host '2. Drag website-upload.zip to upma.cn (opened in browser)'
Write-Host '3. Free signup, copy link, send on WeChat'
Write-Host ''
Write-Host 'If upload still fails: use in-store 打开网站.bat (npm run package)'
Write-Host '============================================'
