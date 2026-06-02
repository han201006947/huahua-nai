@echo off
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B
)
netsh http add urlacl url=http://+:8765/ user=Everyone
netsh advfirewall firewall add rule name="HuahuaNail8765" dir=in action=allow protocol=TCP localport=8765
echo.
echo Done. Phone WiFi + firewall OK.
echo Now double-click START.bat (启动.bat) once.
pause
