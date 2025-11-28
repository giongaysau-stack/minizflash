@echo off
echo ========================================
echo   MiniZ Flash - Upload to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Initializing git repository...
if not exist ".git" (
    git init
    git remote add origin https://github.com/giongaysau-stack/minizflash.git
) else (
    echo Git already initialized.
)

echo.
echo [2/5] Creating firmware folder...
if not exist "firmware" mkdir firmware
echo Firmware folder ready.
echo NOTE: Add your .bin files to the firmware folder!

echo.
echo [3/5] Preparing files...
copy /Y GITHUB_README.md README.md >nul 2>&1

echo.
echo [4/5] Adding files to git...
git add .

echo.
echo [5/5] Committing and pushing...
git commit -m "Initial commit - MiniZ Flash Web Flasher"
git branch -M main
git push -u origin main

echo.
echo ========================================
echo   Upload Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Go to GitHub repo Settings
echo 2. Enable GitHub Pages (main branch)
echo 3. Add firmware .bin files to firmware/
echo 4. Your site: https://giongaysau-stack.github.io/minizflash/
echo.
pause
