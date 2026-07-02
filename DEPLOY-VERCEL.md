# Deploy ke Vercel (dipakai banyak orang)

Ada **2 jalur AI** setelah di-deploy:

1. **AI Online (DeepSeek)** — jalan langsung dari website, **tanpa install apa pun** di
   komputer user. Butuh 1 API key DeepSeek yang disimpan di server Vercel
   (env `DEEPSEEK_API_KEY`) — key TIDAK pernah terlihat di browser.
2. **AI Claude (login)** — bridge lokal di komputer tiap orang, pakai langganan
   Claude Pro/Max masing-masing, tanpa API key.

```
Jalur online:  Website Vercel  →  /api/generate (serverless, DEEPSEEK_API_KEY)  →  DeepSeek API
Jalur Claude:  Website Vercel  →  http://localhost:8787 (bat di laptop user)    →  claude -p (login Pro user)
```

## A0. Mengaktifkan AI Online (sekali saja)

1. Di dashboard Vercel: **Project → Settings → Environment Variables**
2. Tambah variabel: Name = `DEEPSEEK_API_KEY`, Value = API key DeepSeek-mu
   (dapat dari https://platform.deepseek.com → API Keys). Environment: **Production**.
3. **Redeploy** project (env var baru terpakai setelah deploy ulang).
4. Buka website → pilih mesin **AI Online (DeepSeek)** → status harus jadi
   "● AI Online siap ✓".

> ⚠ Endpoint `/api/generate` bisa dipanggil siapa pun yang tahu URL website-mu, dan
> tiap panggilan memakai saldo DeepSeek-mu. Saldo DeepSeek bersifat prepaid (top-up),
> jadi kerugian maksimal = sisa saldo. Jangan sebar URL ke publik luas, dan jangan
> pernah commit API key ke repo (`.env*` sudah di-.gitignore).

## Untuk developer: tes lokal

`vercel dev` membaca `.env.local` (sudah berisi `DEEPSEEK_API_KEY`, di-gitignore)
sehingga `/api/generate` bisa dites di localhost.

---

## A. Sekali saja — taruh website di Vercel

File utama yang dilayani: `index.html` (otomatis tampil di `/`, tanpa konfigurasi).

**Cara termudah (drag & drop):**
1. Buat akun gratis di https://vercel.com
2. Menu **Add New → Project → Deploy** (atau drag folder proyek ini ke dashboard).
   Pastikan folder berisi `index.html`.
3. Klik **Deploy**. Selesai — kamu dapat URL publik, mis. `https://nama-kamu.vercel.app`

**Atau via CLI:**
```bash
npm i -g vercel
cd "folder proyek ini"
vercel        # ikuti prompt; pilih default
vercel --prod # publish ke URL produksi
```

> Karena file utamanya bernama `index.html`, Vercel otomatis menampilkannya di `/` tanpa konfigurasi tambahan.

---

## B. Tiap orang yang mau mode AI Claude (sekali setup per komputer)

> Langkah B–C ini **opsional** — hanya untuk yang mau pakai jalur Claude login.
> Kalau AI Online sudah aktif (bagian A0), user cukup buka website dan langsung generate.

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
- **Tanpa bridge:** kalau user tidak menyalakan bat, mode **Aturan (template)** dan
  **AI Online (DeepSeek)** tetap jalan di website — hanya mode AI Claude yang butuh bridge lokal.
- **Knowledge Base:** tiap user mengedit KB di bridge-nya sendiri (`knowledge-base.txt`
  di komputernya). Tidak saling memengaruhi.
- **Keamanan:** website lain tidak bisa memakai bridge-mu karena tiap permintaan wajib
  membawa KODE PAIRING yang hanya muncul di terminalmu.
- **Mau kode pairing tetap (tidak berubah tiap restart)?** Jalankan dengan variabel:
  `set PAIR_TOKEN=KODEKU & node generator-server.mjs` (atau set di `start-generator.bat`).
