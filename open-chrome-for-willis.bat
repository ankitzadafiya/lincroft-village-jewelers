@echo off
echo.
echo Close ALL Chrome windows first, then press any key...
pause >nul
echo.
echo Starting Chrome with remote debugging (keeps your profile + VPN extensions)...
echo After it opens: enable VPN, open https://willisfinejewelry.com/ then tell Cursor "ready"
echo.
start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data" --profile-directory="Default" "https://willisfinejewelry.com/"
echo.
echo Chrome launched. Leave this window open.
pause
