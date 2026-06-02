# Open Netlify Drop and local dist folder for customer sharing
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectRoot 'dist'
$NetlifyDropUrl = 'https://app.netlify.com/drop'

if (-not (Test-Path (Join-Path $DistDir 'index.html'))) {
    Write-Host '>> dist missing, running npm run build ...'
    Push-Location $ProjectRoot
    npm run build | Out-Host
    Pop-Location
}

Start-Process explorer.exe -ArgumentList $DistDir
Start-Process $NetlifyDropUrl

Write-Host ''
Write-Host '============================================'
Write-Host ' Share with customers (3 steps)'
Write-Host '============================================'
Write-Host '1. Drag the dist folder into the Netlify page'
Write-Host '2. Copy the URL (https://xxx.netlify.app)'
Write-Host '3. Set publicUrl in deploy.config.json, then: npm run gen-qr'
Write-Host '   Send the link or release QR PNG on WeChat'
Write-Host '============================================'
