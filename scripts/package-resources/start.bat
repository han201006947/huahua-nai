@echo off
cd /d "%~dp0"
start "HuahuaNail" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-dist.ps1"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/scan.html"
