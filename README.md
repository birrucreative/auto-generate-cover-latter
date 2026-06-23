# Auto Generate Cover Letter

Generator cover letter Upwork untuk **Cintha F.** (Pitch Deck & Presentation Designer).
Menulis proposal yang **benar-benar tailored** dengan isi pekerjaan yang kamu tempel —
meniru gaya, struktur, dan portofolio dari proposal asli.

Ada **2 mesin** dalam satu alat:

| Mesin | Butuh apa | Hasil |
|---|---|---|
| **Aturan (offline)** | Tidak ada — dobel-klik file HTML | Cepat, berbasis template + deteksi kategori otomatis |
| **AI Claude** | Claude Code lokal (login Pro/Max) | Membaca isi job & menulis tailored — **tanpa API key** |

Mode AI memakai **Claude Code di komputermu sendiri** lewat *local bridge* + *kode pairing*,
jadi tidak perlu API key berbayar. Tiap orang memakai langganan Claude-nya masing-masing.

---

## Cara pakai cepat (lokal)

### Mode Aturan saja (paling simpel)
Dobel-klik **`index.html`** → langsung jalan di browser.

### Mode AI (pakai login Claude lokal)
Prasyarat: **Node.js** + **Claude Code** terpasang & sudah login (`claude` sekali di terminal).

1. Jalankan launcher:
   - **Windows:** dobel-klik `start-generator.bat`
   - **macOS:** dobel-klik `start-generator.command` (sekali: `chmod +x start-generator.command`)
2. Browser otomatis membuka `http://localhost:8787` (kode pairing terisi otomatis).
3. Pilih mesin **AI Claude** → isi job → **Buat Cover Letter**.

---

## Deploy ke Vercel (dipakai banyak orang)

Website statis di Vercel + bridge lokal per orang. Detail lengkap: **[`DEPLOY-VERCEL.md`](DEPLOY-VERCEL.md)**.

Singkatnya: deploy folder ini ke Vercel (file utamanya `index.html`, otomatis tampil di `/`), lalu tiap orang
menjalankan launcher di komputernya dan menempel **kode pairing** ke tombol
"Hubungkan Claude lokal" di website. Browser HTTPS memanggil `http://localhost:8787`
milik user → diteruskan ke `claude -p` (login mereka).

> Chrome/Edge/Firefox mengizinkan https → localhost. **Safari memblokirnya** — pakai Chrome/Edge.

---

## Isi proyek

| File | Fungsi |
|---|---|
| `index.html` | UI generator (mesin Aturan + AI, editor Knowledge Base) |
| `generator-server.mjs` | Bridge lokal: meneruskan job ke `claude -p`, gerbang kode pairing |
| `start-generator.bat` | Launcher Windows |
| `start-generator.command` | Launcher macOS |
| `DEPLOY-VERCEL.md` | Panduan deploy + cara pakai pairing |

---

## Fitur

- Deteksi kategori otomatis (investor / SaaS / fintech / medis / template / akademik / dll) → pilih link Behance + kredibilitas yang cocok
- Mode AI membaca isi job → menyebut detail spesifik (nama produk, jumlah slide, audiens, deadline)
- **Knowledge Base** bisa diedit langsung dari website (profil, contoh bid, peta Behance, aturan gaya)
- Tombol **Variasikan** untuk versi berbeda tiap kirim (hindari flag "generic" Upwork)
- Salin / unduh .txt, hitung kata & karakter

---

🤖 Dibuat dengan bantuan [Claude Code](https://claude.com/claude-code)
