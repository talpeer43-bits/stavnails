$Host.UI.RawUI.WindowTitle = "ציפורניים של סתיו - מפעיל את האתר..."
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host "   💅 ציפורניים של סתיו - מפעיל את האתר והקישור...        " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host ""

$pythonExe = "C:\Users\admin\AppData\Local\Python\bin\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}

# 1. Start backend server if not running on 8000
$portCheck = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if (-not $portCheck) {
    Write-Host "מפעיל שרת מקומי..." -ForegroundColor Yellow
    Start-Process -FilePath $pythonExe -ArgumentList "main.py" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# 2. Kill old cloudflared instances if any
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Start cloudflared tunnel
$logFile = Join-Path $PSScriptRoot "tunnel.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force }

Write-Host "יוצר קישור אינטרנט חינמי ומאובטח..." -ForegroundColor Yellow
$cfProcess = Start-Process -FilePath (Join-Path $PSScriptRoot "cloudflared.exe") `
    -ArgumentList "tunnel --url http://localhost:8000" `
    -RedirectStandardError $logFile `
    -WindowStyle Hidden `
    -PassThru

# 4. Wait and grab the URL from log
$url = $null
for ($i = 0; $i -lt 25; $i++) {
    Start-Sleep -Milliseconds 600
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        if ($content -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
            $url = $matches[1]
            break
        }
    }
}

Clear-Host
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "   🎉 האתר שלך באוויר ופועל באינטרנט!                     " -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""

if ($url) {
    Write-Host " קישור ישיר לשליחה ללקוחות בוואטסאפ ובאינסטגרם:" -ForegroundColor White
    Write-Host ""
    Write-Host " 👉 $url" -ForegroundColor Yellow -BackgroundColor DarkBlue
    Write-Host ""
    Write-Host "===========================================================" -ForegroundColor Green
    Write-Host " • הקישור עובד מכל טלפון ומחשב ללא שום התקנה!" -ForegroundColor Gray
    Write-Host " • לסגירת האתר: פשוט סגור את החלון הזה." -ForegroundColor Gray
    Write-Host "===========================================================" -ForegroundColor Green

    # Save to desktop text file
    $desktop = [Environment]::GetFolderPath("Desktop")
    $desktopFile = Join-Path $desktop "הקישור לאתר של סתיו.txt"
    $info = "הקישור לאתר של סתיו:`r`n$url`r`n`r`nשלחי את הקישור הזה ללקוחות!"
    [System.IO.File]::WriteAllText($desktopFile, $info, [System.Text.Encoding]::UTF8)

    # Save URL shortcut on Desktop
    $urlShortcut = Join-Path $desktop "האתר של סתיו.url"
    "[InternetShortcut]`r`nURL=$url" | Out-File -FilePath $urlShortcut -Encoding ascii

    # Open browser automatically
    Start-Process $url
} else {
    Write-Host "לא ניתן היה ליצור קישור אוטומטי, מפעיל מקומית:" -ForegroundColor Red
    Start-Process "http://localhost:8000"
}

Write-Host ""
Write-Host "השרת פעיל. אל תסגור את החלון כל עוד אתה רוצה שהאתר יעבוד." -ForegroundColor DarkCyan

# Keep script alive while tunnel process runs
try {
    Wait-Process -Id $cfProcess.Id
} catch {
    Read-Host "לחץ Enter לסיום..."
}