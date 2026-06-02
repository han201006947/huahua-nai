# Simple offline bundle: dist + start.bat (no Node, no upload)
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ResourcesDir = Join-Path $PSScriptRoot 'package-resources'
$ReleaseRoot = Join-Path $ProjectRoot 'release'
$PkgName = [string]::Concat(
    [char]0x82B1, [char]0x82B1, [char]0x7F8E, [char]0x7532, [char]0x574A
)
$ReleaseDir = Join-Path $ReleaseRoot $PkgName
$ZipPath = Join-Path $ReleaseRoot ($PkgName + '.zip')
$StartBatCn = [string]::Concat([char]0x542F, [char]0x52A8, '.bat')
$ReadmeCn = [string]::Concat(
    [char]0x8BF4, [char]0x660E, '.txt'
)
$ReadmeSrc = Join-Path $ResourcesDir 'usage.txt'
$WifiOnceSrc = Join-Path $ResourcesDir 'wifi-once.bat'
$WifiOnceCn = [string]::Concat(
    [char]0x5141, [char]0x8BB8, [char]0x624B, [char]0x673A, [char]0x57FA, [char]0x7740, [char]0x7F51, '.bat'
)

Write-Host '>> npm run build'
Push-Location $ProjectRoot
npm run build | Out-Host
Pop-Location

if (Test-Path $ReleaseDir) {
    Remove-Item -LiteralPath $ReleaseDir -Recurse -Force
}
New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null

Write-Host '>> copy dist + launcher'
Copy-Item -Path (Join-Path $ProjectRoot 'dist') -Destination (Join-Path $ReleaseDir 'dist') -Recurse

# 离线包不用失效的 Gitee 线上地址，避免扫码跳到 404
$OfflineSiteUrl = Join-Path $ReleaseDir 'dist\site-url.json'
if (Test-Path $OfflineSiteUrl) {
    Remove-Item -LiteralPath $OfflineSiteUrl -Force
}

Copy-Item -Path (Join-Path $PSScriptRoot 'serve-dist.ps1') -Destination $ReleaseDir
Copy-Item -Path (Join-Path $ResourcesDir 'scan.html') -Destination $ReleaseDir
Copy-Item -Path (Join-Path $ResourcesDir 'qrcode.min.js') -Destination $ReleaseDir
Copy-Item -Path (Join-Path $ResourcesDir 'start.bat') -Destination (Join-Path $ReleaseDir $StartBatCn)
Copy-Item -Path $WifiOnceSrc -Destination (Join-Path $ReleaseDir $WifiOnceCn)
Copy-Item -Path $ReadmeSrc -Destination (Join-Path $ReleaseDir $ReadmeCn)

if (-not (Test-Path $ReleaseRoot)) {
    New-Item -ItemType Directory -Path $ReleaseRoot -Force | Out-Null
}
if (Test-Path $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
}
Write-Host '>> zip'
Compress-Archive -LiteralPath $ReleaseDir -DestinationPath $ZipPath -Force

Start-Process explorer.exe -ArgumentList $ReleaseDir

Write-Host ''
Write-Host '============================================'
Write-Host ' Done: dist + start.bat only'
Write-Host '============================================'
Write-Host "Folder: $ReleaseDir"
Write-Host "Zip:    $ZipPath"
Write-Host '1. Copy folder or zip to shop PC'
Write-Host '2. Double-click START.bat (启动.bat)'
Write-Host '3. Customer scans QR on same WiFi'
Write-Host '============================================'
