@echo off
title Portfolio Local Offline Server
cd /d "%~dp0"
echo Starting Portfolio Local Offline Server...
node server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Node.js encountered an error or is not installed.
    echo Please ensure Node.js 18+ is installed from https://nodejs.org
)
pause
