#!/bin/bash
# Upwork Cover Letter Generator — launcher untuk macOS
# Dobel-klik file ini di Finder untuk menyalakan bridge AI (pakai login Claude Code,
# tanpa API key). Pertama kali, beri izin jalan sekali di Terminal:
#     chmod +x start-generator.command
# Butuh: Node.js + Claude Code sudah terpasang & login (jalankan `claude` sekali).

cd "$(dirname "$0")" || exit 1

echo "Menjalankan server AI (pakai login Claude Code, tanpa API key)..."
echo

# Buka browser HANYA kalau index.html ada (mode lokal penuh).
# Kalau cuma pakai website (tanpa index.html), jangan buka apa-apa — diam saja.
if [ -f index.html ]; then
  ( sleep 2; open "http://localhost:8787" ) >/dev/null 2>&1 &
else
  echo "Mode bridge-only: buka website-mu, lalu Hubungkan pakai KODE PAIRING di bawah."
  echo
fi

node generator-server.mjs

echo
echo "Server berhenti."
read -p "Tekan Enter untuk menutup jendela ini..." _
