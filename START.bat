@echo off
title Magic Realm Battle - Launcher
echo.
echo ======================================
echo   MAGIC REALM BATTLE
echo   Starting local server...
echo ======================================
echo.

REM Try Python 3
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python found. Starting server on http://localhost:8080
    start "" "http://localhost:8080"
    python -m http.server 8080
    goto end
)

REM Try Python 3 explicitly
python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python3 found. Starting server on http://localhost:8080
    start "" "http://localhost:8080"
    python3 -m http.server 8080
    goto end
)

REM Python not found - open directly
echo [WARN] Python not found. Opening game directly (Microphone may not work).
echo [INFO] To enable Microphone, install Python from https://www.python.org/
echo.
start "" "index.html"

:end
pause
