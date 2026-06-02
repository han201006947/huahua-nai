@echo off
cd /d "%~dp0"
start "HuahuaNail" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-dist.ps1"
set /a n=0
:wait
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { (New-Object Net.Sockets.TcpClient).Connect('127.0.0.1',8765); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto open
set /a n+=1
if %n% lss 20 goto wait
echo.
echo Server did not start. Check the HuahuaNail window for errors.
pause
exit /b 1
:open
start "" "http://127.0.0.1:8765/scan.html"
