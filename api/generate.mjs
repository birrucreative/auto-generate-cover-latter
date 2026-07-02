// api/generate.mjs — Vercel serverless function untuk mesin "AI Online (DeepSeek)".
// API key TIDAK pernah dikirim ke browser: disimpan sebagai environment variable
// DEEPSEEK_API_KEY di Vercel (Settings → Environment Variables) atau .env.local.
//
// GET  /api/generate  → status { ok, configured }  (untuk indikator di UI)
// POST /api/generate  → body sama dengan bridge lokal (title, desc, kb, dst) → { text }

const MODELS = {
  flash: 'deepseek-v4-flash',
  pro: 'deepseek-v4-pro',
};

// Sama dengan FIXED_PREAMBLE di generator-server.mjs — jaga format output.
const FIXED_PREAMBLE = `You are a senior Upwork proposal copywriter. Write AS the freelancer described in the FREELANCER PROFILE below — use their name, voice, credibility facts, portfolio links, and example proposals. Read their profile, style rules, portfolio map, and the real examples, then write ONE cover letter tailored to the TARGET JOB. Match their real voice and structure. Output ONLY the final cover letter text — no preamble, no markdown, no notes, no tools.`;

// Sama dengan buildUserPrompt di generator-server.mjs.
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
    'Write ONE Upwork cover letter in the voice of the freelancer described in the profile, tailored to THIS specific job.',
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

async function readJsonBody(req) {
  // Vercel kadang sudah mem-parse body JSON menjadi req.body.
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

export default async function handler(req, res) {
  const send = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  };

  const key = process.env.DEEPSEEK_API_KEY;

  if (req.method === 'GET') {
    return send(200, { ok: true, configured: !!key });
  }
  if (req.method !== 'POST') {
    return send(405, { error: 'Method not allowed' });
  }
  if (!key) {
    return send(500, { error: 'Server belum diberi API key. Set DEEPSEEK_API_KEY di Vercel → Settings → Environment Variables, lalu redeploy.' });
  }

  let body;
  try { body = await readJsonBody(req); }
  catch { return send(400, { error: 'Body bukan JSON valid.' }); }

  if (!body.title && !body.desc) {
    return send(400, { error: 'Isi minimal judul atau deskripsi pekerjaan.' });
  }

  const model = MODELS[body.model] || MODELS.flash;
  const kb = (body.kb && String(body.kb).trim()) ? String(body.kb).trim() : '';
  const system = FIXED_PREAMBLE + (kb ? '\n\n' + kb : '');

  const ctrl = new AbortController();
  const killer = setTimeout(() => ctrl.abort(), 55000);
  try {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: buildUserPrompt(body) },
        ],
        // Sedikit lebih "berani" saat tombol Variasikan ditekan.
        temperature: body.vary ? 1.3 : 1.0,
        // Model "pro" adalah model reasoning: ia "berpikir" dulu (reasoning_content)
        // sebelum menulis — beri ruang cukup agar surat finalnya tidak terpotong.
        max_tokens: 8000,
        stream: false,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = data?.error?.message || ('DeepSeek HTTP ' + r.status);
      return send(502, { error: 'DeepSeek menolak permintaan: ' + msg });
    }
    const text = (data?.choices?.[0]?.message?.content || '').trim();
    if (!text) return send(502, { error: 'DeepSeek mengembalikan jawaban kosong. Coba lagi.' });
    return send(200, { text, model });
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'Timeout 55 detik — DeepSeek tidak merespon.' : e.message;
    return send(502, { error: 'Gagal memanggil DeepSeek: ' + msg });
  } finally {
    clearTimeout(killer);
  }
}
