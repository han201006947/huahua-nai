# Build dist and guide Netlify deploy: anyone can scan QR without same WiFi
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectRoot 'dist'
$ReleaseDir = Join-Path $ProjectRoot 'release'
$NetlifyUrl = 'https://app.netlify.com/'

Write-Host '>> npm run build'
Push-Location $ProjectRoot
npm run build | Out-Host
Pop-Location

if (-not (Test-Path (Join-Path $DistDir 'index.html'))) {
    throw 'dist/index.html not found after build'
}

Start-Process explorer.exe -ArgumentList $DistDir
Start-Process $NetlifyUrl

Write-Host ''
Write-Host '============================================'
Write-Host ' ONLINE QR - anyone can scan (no same WiFi)'
Write-Host '============================================'
Write-Host '1. Sign up / log in at Netlify (free, no card)'
Write-Host '2. Sites -> Add new site -> Deploy manually'
Write-Host '3. Drag ALL files INSIDE dist folder (not dist folder itself)'
Write-Host '4. Copy site URL e.g. https://xxx.netlify.app/'
Write-Host '5. Edit deploy.config.json -> publicUrl -> npm run gen-qr'
Write-Host '6. Use release/customer QR png - WeChat / print'
Write-Host ''
Write-Host 'Update later: drag new dist files to same site Deploys tab'
Write-Host 'In-store WiFi only: npm run out'
Write-Host '============================================'
