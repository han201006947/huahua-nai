# 打包完整 dist（含视频）供免费静态托管上传，顾客扫码/点链接即看
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectRoot 'dist'
$ShareDir = Join-Path $ProjectRoot 'release\dist-share'
$ReleaseDir = Join-Path $ProjectRoot 'release'
$ZipPath = Join-Path $ReleaseDir 'website-upload.zip'
$UpmaUrl = 'https://www.upma.cn/'

# 若无构建产物则先执行 npm run build
if (-not (Test-Path (Join-Path $DistDir 'index.html'))) {
    Write-Host '>> dist missing, running npm run build ...'
    Push-Location $ProjectRoot
    npm run build | Out-Host
    Pop-Location
}

# 清空并重建临时分享目录
if (Test-Path $ShareDir) {
    Remove-Item -LiteralPath $ShareDir -Recurse -Force
}
New-Item -ItemType Directory -Path $ShareDir -Force | Out-Null

# 完整复制 dist（保留 .mp4/.mov/.webm 等视频，作品页可正常播放）
Write-Host '>> copy full dist including videos ...'
robocopy $DistDir $ShareDir /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }

if (-not (Test-Path $ReleaseDir)) {
    New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
}
if (Test-Path $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
}
Compress-Archive -Path (Join-Path $ShareDir '*') -DestinationPath $ZipPath -Force

$ZipMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host ">> zip ready: $ZipMb MB (with videos) -> $ZipPath"

Start-Process explorer.exe -ArgumentList "/select,`"$ZipPath`""
Start-Process $UpmaUrl

Write-Host ''
Write-Host '============================================'
Write-Host ' Full site zip (videos included)'
Write-Host '============================================'
Write-Host "Zip size: $ZipMb MB"
Write-Host '1. Drag website-upload.zip to upma.cn (opened in browser)'
Write-Host '2. Free signup, copy link, fill deploy.config.json'
Write-Host '3. npm run gen-qr -> send link or QR on WeChat'
Write-Host ''
Write-Host 'If upload fails (size limit): use npm run package in-store'
Write-Host '============================================'
