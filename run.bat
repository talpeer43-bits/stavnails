@echo off
chcp 65001 > nul
title ציפורניים של סתיו - מערכת זימון תורים
echo ===================================================
echo     ציפורניים של סתיו - מערכת זימון תורים אונליין
echo ===================================================
echo.
echo מפעיל Cloudflare Tunnel (קישור ציבורי)...
start "" /B .\cloudflared.exe tunnel --url http://localhost:8000

timeout /t 3 /nobreak > nul

echo מפעיל את השרת...
start "" http://localhost:8000

echo.
echo ===================================================
echo האתר פועל! הקישור הציבורי יופיע בחלון שחור נפרד.
echo לסגירה: סגור את החלון הזה
echo ===================================================
echo.

set PYTHON_CMD="C:\Users\admin\AppData\Local\Python\bin\python.exe"

if exist %PYTHON_CMD% (
    %PYTHON_CMD% main.py
) else (
    python main.py
)

pause
