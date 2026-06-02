@echo off
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
    py serve.py
    goto done
)
where python >nul 2>&1
if %errorlevel%==0 (
    python serve.py
    goto done
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-dist.ps1"
:done
pause
