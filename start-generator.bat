@echo off
title Upwork Cover Letter Generator (AI - login Claude)
cd /d "%~dp0"
echo Menjalankan server AI (pakai login Claude Code, tanpa API key)...
echo.
rem Buka browser HANYA kalau index.html ada di folder ini (mode lokal penuh).
rem Kalau cuma pakai website (tanpa index.html), jangan buka apa-apa.
if exist "%~dp0index.html" (
  start "" "http://localhost:8787"
) else (
  echo Mode bridge-only: buka website-mu, lalu Hubungkan pakai KODE PAIRING di bawah.
  echo.
)
node generator-server.mjs
echo.
echo Server berhenti. Tekan tombol apa saja untuk menutup.
pause >nul
