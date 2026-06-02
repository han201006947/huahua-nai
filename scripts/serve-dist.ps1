# Fallback static server when Python is not installed (single-thread, slower).
$ErrorActionPreference = 'Stop'

$RootDir = $PSScriptRoot
$DistDir = Join-Path $RootDir 'dist'
$Port = 8765

if (-not (Test-Path $DistDir)) {
    Write-Host "Missing dist folder: $DistDir" -ForegroundColor Red
    Read-Host 'Press Enter to exit'
    exit 1
}

function Test-PortListening([int]$PortNum) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient('127.0.0.1', $PortNum)
        $c.Close()
        return $true
    } catch {
        return $false
    }
}

function Get-LanIPv4 {
    try {
        $n = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
            Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
            Select-Object -First 1
        if ($n) { return $n.IPAddress }
    } catch {}
    foreach ($a in [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName())) {
        if ($a.AddressFamily -eq 'InterNetwork' -and $a.ToString() -notlike '127.*') {
            return $a.ToString()
        }
    }
    return $null
}

function Get-MimeType([string]$Path) {
    switch ([IO.Path]::GetExtension($Path).ToLower()) {
        '.html' { return 'text/html; charset=utf-8' }
        '.css'  { return 'text/css; charset=utf-8' }
        '.js'   { return 'application/javascript; charset=utf-8' }
        '.json' { return 'application/json; charset=utf-8' }
        '.svg'  { return 'image/svg+xml' }
        '.png'  { return 'image/png' }
        '.jpg'  { return 'image/jpeg' }
        '.jpeg' { return 'image/jpeg' }
        '.webp' { return 'image/webp' }
        '.mp4'  { return 'video/mp4' }
        '.mov'  { return 'video/quicktime' }
        '.webm' { return 'video/webm' }
        default { return 'application/octet-stream' }
    }
}

function Start-HttpServer {
    param([int]$PortNum, [string]$LanIp)
    $plans = @()
    if ($LanIp) {
        $plans += ,@("http://+:$PortNum/", "http://127.0.0.1:$PortNum/", "http://localhost:$PortNum/")
        $plans += ,@("http://${LanIp}:$PortNum/", "http://127.0.0.1:$PortNum/", "http://localhost:$PortNum/")
    }
    $plans += ,@("http://127.0.0.1:$PortNum/", "http://localhost:$PortNum/")

    foreach ($prefixes in $plans) {
        $listener = New-Object System.Net.HttpListener
        foreach ($p in $prefixes) { $listener.Prefixes.Add($p) }
        try {
            $listener.Start()
            $wifiOk = ($prefixes[0] -like 'http://+*') -or ($prefixes[0] -like 'http://192.*') -or ($prefixes[0] -like 'http://10.*')
            return @{ Listener = $listener; WifiOk = $wifiOk }
        } catch {
            $listener.Close()
        }
    }
    throw 'Cannot start HttpListener on port ' + $PortNum
}

if (Test-PortListening $Port) {
    Write-Host "Server already running on port $Port" -ForegroundColor Green
    Start-Process "http://127.0.0.1:$Port/scan.html"
    Read-Host 'Press Enter to close (server keeps running)'
    exit 0
}

$LanIp = Get-LanIPv4
$PhoneUrl = if ($LanIp) { "http://${LanIp}:$Port/" } else { "http://127.0.0.1:$Port/" }

try {
    $started = Start-HttpServer -Port $Port -LanIp $LanIp
    $Listener = $started.Listener
} catch {
    Write-Host "Cannot start server on port $Port : $_" -ForegroundColor Red
    Read-Host 'Press Enter to exit'
    exit 1
}

$LocalUrl = "http://127.0.0.1:$Port/"

Write-Host ''
Write-Host 'Huahua Nail - server running (keep this window open)' -ForegroundColor Green
Write-Host "PC:    $LocalUrl"
Write-Host "QR:    ${LocalUrl}scan.html"
if ($LanIp -and $started.WifiOk) {
    Write-Host "Phone: $PhoneUrl (same WiFi)"
} else {
    Write-Host 'Phone: run ALLOW-WIFI-ONCE.bat as Administrator first' -ForegroundColor Yellow
}
Write-Host 'No Python detected - phone may load slowly. Install Python 3 for speed.'
Write-Host ''

Start-Process "${LocalUrl}scan.html"

while ($Listener.IsListening) {
    $Context = $Listener.GetContext()
    $Request = $Context.Request
    $Response = $Context.Response

    try {
        $RelPath = [Uri]::UnescapeDataString($Request.Url.LocalPath.TrimStart('/'))

        if ($RelPath -eq 'lan.json') {
            $Json = @{ url = $PhoneUrl } | ConvertTo-Json -Compress
            $Bytes = [Text.Encoding]::UTF8.GetBytes($Json)
            $Response.ContentType = 'application/json; charset=utf-8'
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.Close()
            continue
        }

        if ($RelPath -eq 'scan.html' -or $RelPath -eq 'qrcode.min.js') {
            $PkgFile = Join-Path $RootDir ($RelPath -replace '/', [IO.Path]::DirectorySeparatorChar)
            if (Test-Path $PkgFile -PathType Leaf) {
                $Content = [IO.File]::ReadAllBytes($PkgFile)
                $Response.ContentType = Get-MimeType $PkgFile
                $Response.ContentLength64 = $Content.Length
                $Response.OutputStream.Write($Content, 0, $Content.Length)
                $Response.Close()
                continue
            }
        }

        if ([string]::IsNullOrWhiteSpace($RelPath)) { $RelPath = 'index.html' }

        $FullPath = Join-Path $DistDir ($RelPath -replace '/', [IO.Path]::DirectorySeparatorChar)
        $FullPath = [IO.Path]::GetFullPath($FullPath)

        if (-not $FullPath.StartsWith([IO.Path]::GetFullPath($DistDir), [StringComparison]::OrdinalIgnoreCase)) {
            $Response.StatusCode = 403
            $Bytes = [Text.Encoding]::UTF8.GetBytes('403 Forbidden')
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.Close()
            continue
        }

        if (Test-Path $FullPath -PathType Container) {
            $FullPath = Join-Path $FullPath 'index.html'
        }

        if (-not (Test-Path $FullPath -PathType Leaf)) {
            $Response.StatusCode = 404
            $Bytes = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.Close()
            continue
        }

        $Content = [IO.File]::ReadAllBytes($FullPath)
        $Response.ContentType = Get-MimeType $FullPath
        $Response.ContentLength64 = $Content.Length
        $Response.OutputStream.Write($Content, 0, $Content.Length)
    } catch {
        $Response.StatusCode = 500
    } finally {
        $Response.Close()
    }
}
