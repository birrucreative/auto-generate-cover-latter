// Upwork Cover Letter Generator — local AI bridge
// Meneruskan job dari UI ke Claude Code CLI (`claude -p`) yang sudah login
// pakai langganan Claude Pro/Max — TANPA API key.
//
// Jalankan:  node generator-server.mjs   (atau dobel-klik start-generator.bat)
// Lalu buka: http://localhost:8787

import http from 'node:http';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const PORT = process.env.PORT || 8787;
const DIR = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(DIR, 'index.html');
const KB_FILE = path.join(DIR, 'knowledge-base.txt'); // KB kustom yang diedit dari website
const MODELS = new Set(['sonnet', 'opus', 'haiku']);

// Kode pairing: pengaman supaya hanya website yang kamu beri kode ini bisa
// memakai bridge Claude di komputermu. Dicetak saat start; ditempel ke website.
const PAIR_TOKEN = (process.env.PAIR_TOKEN || crypto.randomBytes(4).toString('hex')).toUpperCase();

/* ============================================================
   KNOWLEDGE BASE — profil, anatomi, peta Behance, contoh asli.
   Dipakai sebagai instruksi untuk Claude agar meniru suara Cintha.
   ============================================================ */
// FIXED — instruksi teknis yang TIDAK bisa diedit dari website (jaga format output).
const FIXED_PREAMBLE = `You are a senior Upwork proposal copywriter writing AS Cintha, a pitch deck & presentation designer. Read her profile, style rules, the Behance map, and the real examples below, then write ONE cover letter tailored to the TARGET JOB. Match her real voice and structure. Output ONLY the final cover letter text — no preamble, no markdown, no notes, no tools.`;

// DEFAULT_KB — bagian yang BISA diedit user dari website (disimpan ke knowledge-base.txt).
const DEFAULT_KB = `=== FREELANCER PROFILE ===
Name: Cintha (full: Cintha Fryanda). Headline: Pitch Deck & Presentation Designer | Clean Slides That Close Deals.
Top Rated, 91% Job Success, 4.8/5 (66 reviews), 96 jobs, $20/hr. Based in Semarang, Indonesia.
Credibility facts (use consistently): 6 years of experience in presentation design; completed 1,200+ projects.
Tools: PowerPoint, Google Slides, Canva, Keynote.
Specialties: pitch decks, investor decks, SaaS/sales decks, corporate templates & Slide Master systems, financial/fintech decks, academic/conference decks, healthcare decks, document-to-deck conversion, infographics.

=== PROPOSAL ANATOMY (follow this skeleton) ===
1. Hook line in ALL CAPS (only if requested): "FREE SAMPLE SLIDE AVAILABLE - <SHORT PROJECT TAG>" (use PAGE instead of SLIDE for Word/PDF jobs; TEMPLATE for template jobs). Add a turnaround like " - DELIVERED WITHIN 48 HOURS" ONLY when a turnaround is explicitly given in the settings; never invent or assume one.
2. Greeting: "Hi <ClientFirstName>," if a name is given, else "Hi,".
3. Tailored value sentence: "I'd love to help [transform/polish/redesign/refine/create/expand/convert] your [deck/presentation/template/document] by [SPECIFIC actions tied to THIS job] while keeping it fully editable in [the requested tool]." This sentence MUST name at least one concrete specific from the job (the real deliverable, product/company name, slide count, audience, deadline, or theme).
4. Credibility line: "I have 6 years of experience in presentation design and have completed 1,200+ projects, including [a short list tailored to the job's industry]."
5. Proof: "Relevant project samples:" then ONE Behance link chosen from the map below to match the job.
6. Soft CTA: ask for the current deck/brand assets and offer to review right away, then "Looking forward to collaborating with you."
7. Sign-off: "Best regards," newline "Cintha".

=== BEHANCE LINK MAP (pick the ONE best match) ===
- Corporate / general / company profile / business: https://www.behance.net/gallery/241280717/Corporate-Polished-Deck
- Investor / pitch deck / fundraising: https://www.behance.net/gallery/240954323/Investor-Pitch-Deck
- SaaS / technology / B2B / cybersecurity / AI: https://www.behance.net/gallery/237093537/Real-Estate-Presentation
- Finance / fintech / banking / financial report / document formatting: https://www.behance.net/gallery/240325311/Fintech-Banking-Presentation
- Wealth / acquisition / M&A / high-end / institutional: https://www.behance.net/gallery/240537615/High-End-Wealth-Pitch-Presentation
- Academic / education / course / training / conference / research: https://www.behance.net/gallery/239951015/Course-Presentation
- Medical / healthcare / pharma / clinical: https://www.behance.net/gallery/239680335/Medical-Pitch-Deck
- Template / Slide Master / brand system / Figma-to-PPT: https://www.behance.net/gallery/241280717/Corporate-Polished-Deck
- Creative / themed / event / whimsical: https://www.behance.net/gallery/229016783/Creative-Business-Presentation

=== STYLE RULES ===
- "structured" style = use the full anatomy above (hook + tailored value + credibility line + "Relevant project samples:" + matched Behance + soft CTA + sign-off). This is the strongest, most tailored style. Default to this.
- "expert" style = warmer/lighter: greeting, one tailored value sentence, then "I'm Cintha, a presentation design expert who helps clients from any industry turn ideas into impactful presentations. With 6 years of experience and over 1,200 completed projects, I'm proficient in PowerPoint, Canva, Google Slides, and Keynote.", then "Feel free to check my portfolio below:" + the matched Behance link, then offer a FREE SAMPLE SLIDE, then "Best regards," / "Cintha Fryanda".
- Length ~110-170 words. Natural, confident, specific — never generic filler. Tie every claim to the job.
- Plain text only. Real line breaks between blocks. No bullet symbols unless natural. No bold/headers/markdown.

=== REAL EXAMPLES (Cintha's actual winning voice) ===

[Example A — pitch deck polish, named client, structured]
FREE SAMPLE SLIDE AVAILABLE - DELIVERED WITHIN 48 HOURS.

DECK POLISH
Hi Suresh,

I'd love to help transform your AI-generated startup pitch deck into a polished, customer-ready presentation by refining typography, visual hierarchy, spacing, layout consistency, and brand alignment while keeping the deck fully editable in PowerPoint.

I have 6 years of experience in presentation design and have completed 1,200+ projects, including startup pitch decks, SaaS sales presentations, investor decks, and branded PowerPoint presentations.

Relevant project samples:
https://www.behance.net/gallery/241280717/Corporate-Polished-Deck

Please share the current deck and brand assets, and I'll review them right away.
Looking forward to collaborating with you.

Best regards,
Cintha

[Example B — template expansion, named client]
FREE SAMPLE SLIDE AVAILABLE - POWERPOINT TEMPLATE EXPANSION & OPTIMIZATION

Hi Gerben,

I'd love to help expand your newly rebranded PowerPoint template by adding new B2B slide layouts, optimizing the existing template structure, and ensuring all elements are fully editable, reusable, and aligned with your brand guidelines.

I have 6 years of experience in presentation design and have completed 1,200+ projects, including PowerPoint template systems, branded slide libraries, corporate presentation templates, and fully editable master slide designs.

Relevant project samples:
https://www.behance.net/gallery/241280717/Corporate-Polished-Deck

Please share the current template, reference deck, and brand assets, and I'll review them right away.
Looking forward to collaborating with you.

Best regards,
Cintha

[Example C — document/Word formatting, PAGE sample]
FREE SAMPLE PAGE AVAILABLE - PROFESSIONAL FINANCIAL REPORT FORMATTING

Hi David,

I'd love to help transform your financial framework document into a polished, boardroom-quality report by applying the visual style, typography, colours, and design language of your existing pitch presentation while improving layout consistency, spacing, table formatting, and PDF-ready presentation without altering the content.

I have 6 years of experience in presentation and document design and have completed 1,200+ projects, including financial, investor, and corporate communication materials.

Relevant project samples:
https://www.behance.net/gallery/240325311/Fintech-Banking-Presentation

The final document will be clean, professionally formatted, visually consistent, and ready to share with prospective owners.
Looking forward to collaborating with you.

Best regards,
Cintha

[Example D — SaaS/B2B with a price quote]
FREE SAMPLE SLIDE AVAILABLE - TURNING COMPLEX CYBERSECURITY INTO BUYER-READY VISUAL

Hi,

I'd love to help create a high-impact B2B sales deck by transforming complex cybersecurity concepts and software architecture into clear, persuasive visuals that are easy for enterprise buyers to understand, with a clean, modern design and highly scannable layouts.

I have 6 years of experience in presentation design and have completed 1,200+ projects, including SaaS, technology, and enterprise-focused presentations.

Relevant project samples:
https://www.behance.net/gallery/237093537/Real-Estate-Presentation

Fixed-price quote: $250 for the complete 12-slide deck.
Estimated turnaround: 3-5 business days, including revision rounds.

Looking forward to collaborating with you.

Best regards,
Cintha

[Example E — academic, no client name]
FREE SAMPLE SLIDE AVAILABLE - ACADEMIC CONFERENCE POWERPOINT DESIGN

Hi,

I'd love to help transform your existing academic presentation into a conference-ready PowerPoint deck with professional visual storytelling, infographics, timelines, and polished layouts designed for forensic psychologists, legal professionals, and mental health audiences.

I have 6 years of experience in presentation design and have completed 1,200+ projects, including academic presentations, healthcare and research decks, conference presentations, and data-driven PowerPoint designs.

Relevant project samples:
https://www.behance.net/gallery/239951015/Course-Presentation

Please share the current presentation and any conference guidelines, and I'll review them right away.
Looking forward to collaborating with you.

Best regards,
Cintha
`;

/* ============================================================ */

function buildUserPrompt(b) {
  const sw = Array.isArray(b.software) && b.software.length ? b.software : ['PowerPoint'];
  const isDoc = sw.includes('Word/PDF');
  const lines = [
    '=== TARGET JOB ===',
    'Client first name: ' + (b.client ? b.client : '(not shown — use "Hi,")'),
    'Job title: ' + (b.title || '(none)'),
    'Job description:',
    (b.desc || '(none provided)'),
    '',
    '=== PROPOSAL SETTINGS ===',
    'Style: ' + (b.style === 'expert' ? 'expert' : 'structured'),
    'Keep editable in: ' + sw.join(', ') + (isDoc ? ' (this is a Word/PDF document job — use "PAGE" in the hook, and "document" as the deliverable)' : ''),
    'Turnaround to mention: ' + (b.turnaround ? b.turnaround : '(none — do not invent one)'),
    'Bid/scope note to weave in: ' + (b.bid ? b.bid : '(none)'),
    'Category hint: ' + (b.category && b.category !== 'auto' ? b.category : 'auto — you decide from the description'),
    'Include ALL-CAPS hook line: ' + (b.hook ? 'yes' : 'no'),
    '',
    '=== TASK ===',
    'Write ONE Upwork cover letter for Cintha tailored to THIS specific job.',
    '- Name at least one concrete specific from the description (real deliverable, product/company, slide count, audience, theme, or deadline).',
    '- Choose the single Behance link whose category best matches this job.',
    '- Tailor the credibility list to this industry.',
    '- ~110-170 words. Output ONLY the letter text. No preamble, no markdown, no commentary.',
    '- Do NOT promise any delivery time / turnaround unless one is given in the settings above.',
  ];
  if (b.vary) {
    lines.push('- IMPORTANT: produce a NOTICEABLY DIFFERENT wording from a typical version (vary the value sentence, CTA phrasing and project tag) while keeping the same facts and structure.');
  }
  return lines.join('\n');
}

// KB aktif: pakai file kustom bila ada & tidak kosong, jika tidak pakai bawaan.
async function loadKB() {
  try {
    const txt = await readFile(KB_FILE, 'utf8');
    if (txt && txt.trim()) return txt;
  } catch { /* belum ada file kustom */ }
  return DEFAULT_KB;
}

function runClaude(userPrompt, model, kb) {
  return new Promise((resolve, reject) => {
    const payload = FIXED_PREAMBLE + '\n\n' + (kb || DEFAULT_KB) + '\n\n' + userPrompt;
    const args = ['--print', '--model', MODELS.has(model) ? model : 'sonnet'];
    const child = spawn('claude', args, {
      cwd: os.tmpdir(),                 // netral: hindari CLAUDE.md proyek ikut terbaca
      shell: process.platform === 'win32',
      windowsHide: true,
    });
    let out = '', err = '';
    const killer = setTimeout(() => { child.kill(); reject(new Error('Timeout 150s — Claude tidak merespon.')); }, 150000);
    child.stdout.on('data', d => (out += d));
    child.stderr.on('data', d => (err += d));
    child.on('error', e => {
      clearTimeout(killer);
      reject(e.code === 'ENOENT'
        ? new Error('Perintah `claude` tidak ditemukan. Pastikan Claude Code terpasang & ada di PATH.')
        : e);
    });
    child.on('close', code => {
      clearTimeout(killer);
      if (code === 0 && out.trim()) resolve(out.trim());
      else reject(new Error(err.trim() || ('claude keluar dengan kode ' + code)));
    });
    child.stdin.write(payload);
    child.stdin.end();
  });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pair-Token',
  'Access-Control-Max-Age': '86400',
};

const server = http.createServer(async (req, res) => {
  const send = (code, type, body) => {
    res.writeHead(code, { 'Content-Type': type, ...CORS });
    res.end(body);
  };
  // Gerbang pairing: hanya request yang membawa kode benar yang dilayani.
  const tokenOk = () => String(req.headers['x-pair-token'] || '').toUpperCase() === PAIR_TOKEN;
  const denied = () => send(401, 'application/json', JSON.stringify({
    error: 'Belum terhubung / kode pairing salah. Jalankan start-generator.bat, salin kodenya, lalu klik "Hubungkan Claude lokal" di website.'
  }));

  // Preflight CORS dari browser
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }

  // Halaman dilayani lokal oleh bridge → suntik token & flag supaya tak perlu pairing manual
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/index'))) {
    try {
      let html = await readFile(HTML, 'utf8');
      const inject = `<script>window.__BRIDGE_TOKEN__=${JSON.stringify(PAIR_TOKEN)};window.__BRIDGE_LOCAL__=true;</script>`;
      html = html.includes('</head>') ? html.replace('</head>', inject + '\n</head>') : inject + html;
      send(200, 'text/html; charset=utf-8', html);
    } catch {
      send(500, 'text/plain', 'index.html tidak ditemukan di folder yang sama.');
    }
    return;
  }

  // Bridge hidup? (tanpa token — supaya website bisa deteksi keberadaan bridge)
  if (req.method === 'GET' && req.url === '/health') {
    send(200, 'application/json', JSON.stringify({ ok: true }));
    return;
  }

  // Cek kode pairing benar (untuk tombol "Hubungkan" di website)
  if (req.method === 'GET' && req.url === '/ping-auth') {
    return tokenOk() ? send(200, 'application/json', JSON.stringify({ ok: true })) : denied();
  }

  // Baca KB aktif (untuk editor di website)
  if (req.method === 'GET' && req.url === '/kb') {
    if (!tokenOk()) return denied();
    let isCustom = false, kb = DEFAULT_KB;
    try { const t = await readFile(KB_FILE, 'utf8'); if (t && t.trim()) { kb = t; isCustom = true; } } catch {}
    send(200, 'application/json', JSON.stringify({ kb, isCustom, default: DEFAULT_KB }));
    return;
  }

  // Simpan / reset KB. Body { kb: "..." }; kb kosong = reset ke bawaan.
  if (req.method === 'POST' && req.url === '/kb') {
    if (!tokenOk()) return denied();
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', async () => {
      let body;
      try { body = JSON.parse(raw || '{}'); }
      catch { return send(400, 'application/json', JSON.stringify({ error: 'Body bukan JSON valid.' })); }
      try {
        if (!body.kb || !body.kb.trim()) {
          try { await unlink(KB_FILE); } catch {}
          console.log('[kb] reset ke bawaan');
          return send(200, 'application/json', JSON.stringify({ ok: true, reset: true }));
        }
        await writeFile(KB_FILE, body.kb, 'utf8');
        console.log(`[kb] tersimpan (${body.kb.length} karakter)`);
        send(200, 'application/json', JSON.stringify({ ok: true }));
      } catch (e) {
        send(500, 'application/json', JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/generate') {
    if (!tokenOk()) return denied();
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', async () => {
      let body;
      try { body = JSON.parse(raw || '{}'); }
      catch { return send(400, 'application/json', JSON.stringify({ error: 'Body bukan JSON valid.' })); }
      if (!body.title && !body.desc) {
        return send(400, 'application/json', JSON.stringify({ error: 'Isi minimal judul atau deskripsi pekerjaan.' }));
      }
      const t0 = Date.now();
      try {
        const kb = await loadKB();
        const text = await runClaude(buildUserPrompt(body), body.model, kb);
        console.log(`[generate] ok in ${((Date.now() - t0) / 1000).toFixed(1)}s · model=${body.model || 'sonnet'} · "${(body.title || '').slice(0, 50)}"`);
        send(200, 'application/json', JSON.stringify({ text }));
      } catch (e) {
        console.error('[generate] error:', e.message);
        send(500, 'application/json', JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  send(404, 'text/plain', 'Not found');
});

server.listen(PORT, () => {
  console.log('════════════════════════════════════════════════');
  console.log('  Upwork Cover Letter Generator — AI bridge aktif');
  console.log('  Pakai login Claude Code (tanpa API key).');
  console.log('');
  console.log('  KODE PAIRING:   ' + PAIR_TOKEN);
  console.log('');
  console.log('  Pakai LOKAL  :  buka  http://localhost:' + PORT);
  console.log('                  (kode pairing terisi otomatis)');
  console.log('  Pakai WEBSITE:  buka website-mu, klik "Hubungkan');
  console.log('                  Claude lokal", tempel kode di atas.');
  console.log('  Stop server  :  Ctrl + C');
  console.log('════════════════════════════════════════════════');
});
