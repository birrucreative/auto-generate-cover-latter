@echo off
title Upwork Cover Letter Generator (AI - login Claude)
cd /d "%~dp0"
echo Menjalankan server AI (pakai login Claude Code, tanpa API key)...
echo.
start "" "http://localhost:8787"
node generator-server.mjs
echo.
echo Server berhenti. Tekan tombol apa saja untuk menutup.
pause >nul
