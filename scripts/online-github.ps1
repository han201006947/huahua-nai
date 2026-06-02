# Build dist, open GitHub Pages guide (simpler than Netlify in China)
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectRoot 'dist'
$StepsFile = Join-Path $PSScriptRoot 'online-github-steps.txt'
$ReleaseDir = Join-Path $ProjectRoot 'release'
$GithubNew = 'https://github.com/new'

Write-Host '>> npm run build'
Push-Location $ProjectRoot
npm run build | Out-Host
Pop-Location

if (-not (Test-Path (Join-Path $DistDir 'index.html'))) {
    throw 'dist/index.html not found after build'
}

if (-not (Test-Path $ReleaseDir)) {
    New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
}
Copy-Item -LiteralPath $StepsFile -Destination (Join-Path $ReleaseDir 'online-github-steps.txt') -Force

Start-Process explorer.exe -ArgumentList $DistDir
Start-Process $GithubNew
Start-Process notepad.exe -ArgumentList (Join-Path $ReleaseDir 'online-github-steps.txt')

Write-Host ''
Write-Host '============================================'
Write-Host ' GitHub Pages - online QR (simple)'
Write-Host '============================================'
Write-Host '1. Notepad opened with Chinese steps - follow it'
Write-Host '2. dist folder opened - upload these files to GitHub'
Write-Host '3. After Pages URL ready: deploy.config.json + npm run gen-qr'
Write-Host '============================================'
