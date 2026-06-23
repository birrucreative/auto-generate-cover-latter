# Deploy ke Vercel (dipakai banyak orang, tiap orang pakai Claude-nya sendiri)

Arsitektur: **website publik di Vercel** + **bridge lokal** di komputer tiap orang.
Website cuma tampilan (statis, gratis, tanpa server). Mesin AI-nya = Claude Code
di komputer masing-masing user, dihubungkan lewat **kode pairing**. **Tanpa API key.**

```
Website Vercel (1 URL, semua orang)  →  http://localhost:8787 (bat di laptop user)  →  claude -p (login Pro user)
```

---

## A. Sekali saja — taruh website di Vercel

File yang dibutuhkan sudah ada: `cover-letter-generator.html` + `vercel.json`.

**Cara termudah (drag & drop):**
1. Buat akun gratis di https://vercel.com
2. Menu **Add New → Project → Deploy** (atau drag folder proyek ini ke dashboard).
   Pastikan folder berisi `cover-letter-generator.html` dan `vercel.json`.
3. Klik **Deploy**. Selesai — kamu dapat URL publik, mis. `https://nama-kamu.vercel.app`

**Atau via CLI:**
```bash
npm i -g vercel
cd "folder proyek ini"
vercel        # ikuti prompt; pilih default
vercel --prod # publish ke URL produksi
```

> `vercel.json` membuat root `/` otomatis membuka generator-nya.

---

## B. Tiap orang yang mau mode AI (sekali setup per komputer)

1. Install **Node.js** (https://nodejs.org) dan **Claude Code**, lalu login:
   jalankan `claude` sekali di terminal sampai bisa dipakai.
2. Salin file ke komputernya: `generator-server.mjs` + launcher sesuai OS:
   - **Windows:** `start-generator.bat`
   - **macOS:** `start-generator.command` — sekali saja beri izin jalan:
     buka Terminal di folder itu, ketik `chmod +x start-generator.command`
     (atau klik-kanan file → Open, lalu Allow).

## C. Pakai sehari-hari

1. Nyalakan launcher → terminal menampilkan **KODE PAIRING** (mis. `A1B2C3D4`):
   - Windows: dobel-klik **start-generator.bat**
   - macOS: dobel-klik **start-generator.command**
2. Buka URL website (yang di Vercel) di **Chrome/Edge**.
3. Pilih mesin **"AI Claude (login)"** → muncul kotak **"Hubungkan Claude lokal"**.
4. Tempel KODE PAIRING, klik **Hubungkan** → status jadi *Terhubung ✓*.
5. Isi job → **Buat Cover Letter (AI)**.

Kode pairing tersimpan di browser, jadi besok cukup nyalakan bat lagi (kode tetap sama
selama bat tidak di-restart; kalau restart, kodenya baru — tempel ulang).

---

## Catatan penting

- **Browser:** Chrome / Edge / Firefox mengizinkan website https memanggil `http://localhost`.
  **Safari** sering memblokirnya — pakai Chrome/Edge.
- **Tanpa bridge:** kalau user tidak menyalakan bat, mode **Aturan (template)** tetap jalan
  di website — hanya mode AI yang butuh bridge lokal.
- **Knowledge Base:** tiap user mengedit KB di bridge-nya sendiri (`knowledge-base.txt`
  di komputernya). Tidak saling memengaruhi.
- **Keamanan:** website lain tidak bisa memakai bridge-mu karena tiap permintaan wajib
  membawa KODE PAIRING yang hanya muncul di terminalmu.
- **Mau kode pairing tetap (tidak berubah tiap restart)?** Jalankan dengan variabel:
  `set PAIR_TOKEN=KODEKU & node generator-server.mjs` (atau set di `start-generator.bat`).
