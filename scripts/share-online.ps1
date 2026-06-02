# 一键打开 Netlify Drop 与本机 dist，便于拖上传后把链接发给顾客
$ErrorActionPreference = 'Stop'

# 项目根目录
$ProjectRoot = Split-Path -Parent $PSScriptRoot
# dist 构建产物目录
$DistDir = Join-Path $ProjectRoot 'dist'
# Netlify 拖拽上传页（免费，无需写代码）
$NetlifyDropUrl = 'https://app.netlify.com/drop'

# 若 dist 不存在则先构建
if (-not (Test-Path (Join-Path $DistDir 'index.html'))) {
    Write-Host '>> dist 不存在，正在 npm run build ...'
    Push-Location $ProjectRoot
    npm run build | Out-Host
    Pop-Location
}

# 打开 dist 文件夹，方便整夹拖进浏览器
Start-Process explorer.exe -ArgumentList $DistDir
# 打开 Netlify 上传页
Start-Process $NetlifyDropUrl

Write-Host ''
Write-Host '============================================'
Write-Host '  发给顾客 · 最简单 3 步'
Write-Host '============================================'
Write-Host '1. 把刚打开的 dist 文件夹，拖到浏览器 Netlify 页面里'
Write-Host '2. 等几秒，复制网页给你的网址（https://xxx.netlify.app）'
Write-Host '3. 把网址填进 deploy.config.json 的 publicUrl，再执行：'
Write-Host '      npm run gen-qr'
Write-Host '   用 release/顾客扫码二维码.png 或直接把链接发微信'
Write-Host ''
Write-Host '说明：ProductVisualization.exe 仅适合本机演示，不要发给手机顾客。'
Write-Host '============================================'
