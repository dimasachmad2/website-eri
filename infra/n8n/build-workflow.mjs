// Menghasilkan workflow n8n "ERI — Artikel via Telegram" (file JSON siap impor).
//
//   node infra/n8n/build-workflow.mjs [ID_TELEGRAM,ID_TELEGRAM2]
//
// Output: infra/n8n/out/eri-telegram-articles.json (di-gitignore karena berisi
// alamat webhook acak — alamat itu yang menjadi "kunci" webhook).
//
// Alur DUA LANGKAH (model gateway lemah untuk keluaran 8-kolom dwibahasa sekaligus):
//   1) tulis artikel Bahasa Indonesia — 4 tag XML <judul><ringkasan><kategori><isi>
//   2) terjemahkan ke Bahasa Inggris  — 3 tag XML <judul><ringkasan><isi>
// lalu kode menggabungkan jadi 8 kolom Directus. Bila langkah 2 gagal, kolom EN
// memakai teks Indonesia (draft tetap tersimpan). Telegram → Directus (draft) →
// pratinjau (Publish/Revisi/Batal) → Directus (published) → rebuild website.
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const allowed = (process.argv[2] || '').split(',').map((s) => s.trim()).filter(Boolean).map(Number);

// Pertahankan alamat webhook dari build sebelumnya bila ada, supaya impor ulang
// tidak perlu setWebhook lagi ke Telegram. Baru diacak bila belum pernah dibuat.
let WEBHOOK_PATH, WEBHOOK_ID;
try {
  const prev = JSON.parse(readFileSync(join(here, 'out', 'eri-telegram-articles.json'), 'utf8'));
  const wh = prev.nodes.find((n) => n.type === 'n8n-nodes-base.webhook');
  WEBHOOK_PATH = wh?.parameters?.path;
  WEBHOOK_ID = wh?.webhookId;
} catch { /* belum ada build sebelumnya */ }
WEBHOOK_PATH ||= `tg-${randomBytes(16).toString('hex')}`;
WEBHOOK_ID ||= randomUUID();

const CMS_PUBLIC = 'https://cms.enviroresources.co.id';
const SITE = 'https://enviroresources.co.id';
const CATEGORIES = ['Regulasi', 'Persetujuan Teknis', 'Pelaporan', 'PROPER', 'Prasarana Limbah', 'Lainnya'];

// Cover default per kategori (file id di Directus, diunggah sekali dari Unsplash).
// Dipakai untuk pilihan "Default" dan sebagai cadangan bila AI gagal.
const DEFAULT_COVERS = {
  'Regulasi': '8fd61715-3721-4929-8a41-764585d71fe0',
  'Persetujuan Teknis': '1f0e6298-0105-426a-910e-c117efc02e2f',
  'Pelaporan': 'e72ce154-f585-47ad-8b74-85700b38ad1e',
  'PROPER': 'b1c876b3-e3fa-4a1f-87c2-c35216bff784',
  'Prasarana Limbah': '8c9fcda3-5f4d-491f-8ba2-90d5c628088f',
  'Lainnya': 'f3eb62eb-d16d-44fc-b1a2-cce2546be5d5',
};

const LAYANAN = 'AMDAL, UKL-UPL, SPPL, DELH/DPLH, Persetujuan Teknis air limbah & emisi, SLO, Rincian Teknis Limbah B3, Andalalin, SIPA, pelaporan RKL-RPL, audit lingkungan, pendampingan PROPER, prasarana pengolahan limbah (IPAL), pengelolaan limbah non-B3';

// Langkah 1 — tulis artikel Bahasa Indonesia (4 tag). Prompt sengaja ringkas:
// model di gateway patuh format bila prompt pendek & satu bahasa.
const SYSTEM_ID = `Kamu penulis artikel untuk PT Enviro Resources Indonesia (ERI), konsultan lingkungan di Sidoarjo, Jawa Timur. Layanan ERI: ${LAYANAN}.

Ubah catatan tim ERI menjadi artikel wawasan Bahasa Indonesia untuk pembaca pemilik usaha & manajer HSE: jelas, praktis, akurat. Jelaskan istilah teknis saat pertama muncul. JANGAN mengarang nomor peraturan, nomor pasal, angka baku mutu, biaya, atau tenggat; bila ragu jelaskan umum dan sarankan konsultasi kasus spesifik. Panjang isi sekitar 600-900 kata, diakhiri satu paragraf ajakan konsultasi ke ERI.

Keluarkan HANYA empat tag XML ini berurutan, tanpa teks atau Markdown di luar tag:
<judul>judul artikel</judul>
<ringkasan>ringkasan 1-2 kalimat, maksimal 200 karakter</ringkasan>
<kategori>pilih satu: ${CATEGORIES.join(' | ')}</kategori>
<isi>isi HTML memakai <h2>,<h3>,<p>,<ul>,<ol>,<li>,<strong>,<em>,<blockquote>. Tanpa <h1>, gambar, style, atau atribut.</isi>

Mulai LANGSUNG dengan <judul>. Jangan menulis judul Markdown (#), tabel, atau kalimat pembuka sebelum <judul>.`;

// Langkah 2 — terjemahkan artikel Indonesia ke Inggris (3 tag).
const SYSTEM_EN = `Kamu penerjemah profesional untuk PT Enviro Resources Indonesia (ERI). Terjemahkan artikel konsultan lingkungan dari Bahasa Indonesia ke Bahasa Inggris yang natural. Pertahankan makna dan SEMUA tag HTML di dalam isi persis. Jangan menambah atau menghapus bagian.

Keluarkan HANYA tiga tag XML ini berurutan, tanpa teks atau Markdown di luar tag:
<judul>English title</judul>
<ringkasan>English summary (1-2 sentences)</ringkasan>
<isi>English HTML body, same tags as the source</isi>

Mulai LANGSUNG dengan <judul>.`;

// Prompt gambar siap tempel (untuk ChatGPT/Gemini/Midjourney) saat admin memilih
// "📎 Lampirkan foto". Satu tag saja; gagal/terlambat → template dari SCENES.
const SYSTEM_IMG = `You write prompts for AI image generators (ChatGPT, Gemini, Midjourney). Given an article from an Indonesian environmental consulting firm, write ONE English prompt (60-120 words) for a cover photo: a concrete, realistic scene that fits the article topic, set in Indonesia (East Java), professional editorial photography, natural light, clean composition, green and neutral tones. Never ask for text, words, signs, logos or watermarks in the image. End with: "16:9 landscape, photorealistic, no text, no logos, no watermark."

Output ONLY: <prompt>the prompt</prompt>`;

// Roadmap baru (/roadmapbaru <fokus>) — AI mengusulkan RM_COUNT ide artikel, blok tag berulang.
const RM_COUNT = 8;
const SYSTEM_RM = `Kamu perencana konten SEO untuk PT Enviro Resources Indonesia (ERI), konsultan lingkungan di Sidoarjo, Jawa Timur. Layanan ERI: ${LAYANAN}.

Susun ${RM_COUNT} ide artikel blog untuk fokus yang diberikan. Tiap ide menyasar SATU kata kunci pencarian Google yang realistis diketik pemilik usaha atau manajer HSE di Indonesia (huruf kecil, 2-5 kata). Judul jelas dan menarik, maksimal 80 karakter. Jangan mengarang nomor peraturan atau angka. Jangan mengulang judul yang sudah ada.

Keluarkan HANYA ${RM_COUNT} blok ini berurutan, tanpa teks atau Markdown lain:
<artikel><judul>judul artikel</judul><keyword>kata kunci</keyword><sudut>1 kalimat: apa yang dibahas dan untuk siapa</sudut></artikel>

Mulai LANGSUNG dengan <artikel>.`;

// Adegan dasar per kategori untuk template prompt cadangan.
const SCENES = {
  'Regulasi': 'an Indonesian business owner and an environmental consultant reviewing permit documents at a desk in a bright modern office, a factory visible through the window',
  'Persetujuan Teknis': 'an environmental engineer in a white safety helmet inspecting a wastewater discharge outlet and an emission stack at an Indonesian factory',
  'Pelaporan': 'an HSE manager reviewing environmental monitoring charts on a laptop, labelled water sample bottles on the table, industrial site in the background',
  'PROPER': 'a clean, well-managed Indonesian industrial facility with green landscaping, tidy waste storage area and solar panels on the roof',
  'Prasarana Limbah': 'a modern wastewater treatment plant with aeration tanks and clarifiers at an Indonesian industrial estate, an engineer checking the water',
  'Lainnya': 'environmental consultants doing a field survey at an industrial site in East Java, holding a clipboard and a water quality meter',
};

// ── Builder ───────────────────────────────────────────────────────────────
const nodes = [];
const connections = {};
const node = (name, type, typeVersion, parameters, position, extra = {}) => {
  nodes.push({ id: randomUUID(), name, type, typeVersion, position, parameters, ...extra });
  return name;
};
const link = (...names) => {
  for (let i = 0; i < names.length - 1; i++) {
    (connections[names[i]] ??= { main: [[]] }).main[0].push({ node: names[i + 1], type: 'main', index: 0 });
  }
};
// Isi Code node ditulis sebagai fungsi JS biasa lalu diambil badannya.
const body = (fn) => {
  const s = fn.toString();
  return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')).replace(/^\n/, '').replace(/\n\s*$/, '\n');
};
const fill = (code, vars) => Object.entries(vars).reduce((c, [k, v]) => c.split(k).join(v), code);
const VARS = {
  __SYSTEM_ID__: JSON.stringify(SYSTEM_ID),
  __SYSTEM_EN__: JSON.stringify(SYSTEM_EN),
  __SYSTEM_IMG__: JSON.stringify(SYSTEM_IMG),
  __SCENES__: JSON.stringify(SCENES),
  __SYSTEM_RM__: JSON.stringify(SYSTEM_RM),
  __RM_COUNT__: String(RM_COUNT),
  __CATEGORIES__: JSON.stringify(CATEGORIES),
  __DEFAULT_COVERS__: JSON.stringify(DEFAULT_COVERS),
  __CMS__: JSON.stringify(CMS_PUBLIC),
  __SITE__: JSON.stringify(SITE),
  __ALLOWED__: JSON.stringify(allowed),
};
const code = (name, fn, pos) => node(name, 'n8n-nodes-base.code', 2, { jsCode: fill(body(fn), VARS) }, pos);
// Code node dengan placeholder tambahan (mis. nama node sumber) yang diisi per-node.
const codeX = (name, fn, extra, pos) =>
  node(name, 'n8n-nodes-base.code', 2, { jsCode: fill(body(fn), { ...VARS, ...extra }) }, pos);
const http = (name, { method = 'POST', url, headers = [], json, query, timeout }, pos, continueOnError = false) =>
  node(
    name, 'n8n-nodes-base.httpRequest', 4.2,
    {
      method,
      url,
      ...(query ? { sendQuery: true, queryParameters: { parameters: query } } : {}),
      ...(headers.length ? { sendHeaders: true, headerParameters: { parameters: headers } } : {}),
      ...(json ? { sendBody: true, specifyBody: 'json', jsonBody: json } : {}),
      options: timeout ? { timeout } : {},
    },
    pos,
    continueOnError ? { onError: 'continueRegularOutput' } : {},
  );
const tg = (name, method, json, pos, continueOnError = false) =>
  http(name, { url: `=https://api.telegram.org/bot{{ $env.TELEGRAM_BOT_TOKEN }}/${method}`, json }, pos, continueOnError);
const dx = (name, method, path, { json, query } = {}, pos, continueOnError = false) =>
  http(
    name,
    {
      method,
      url: `={{ $env.DIRECTUS_URL }}${path}`,
      headers: [{ name: 'Authorization', value: '=Bearer {{ $env.DIRECTUS_WRITER_TOKEN }}' }],
      json,
      query,
    },
    pos,
    continueOnError,
  );
// Endpoint OpenAI-compatible (chat completions). LLM_BASE_URL sudah termasuk versinya.
const llm = (name, pos, timeout = 300000) =>
  http(
    name,
    {
      url: "={{ String($env.LLM_BASE_URL).replace(/\\/+$/, '') }}/chat/completions",
      headers: [{ name: 'Authorization', value: '=Bearer {{ $env.LLM_API_KEY }}' }],
      json: '={{ JSON.stringify($json.request) }}',
      timeout,
    },
    pos,
    true,
  );
// Endpoint gambar: POST /images/generations dengan {prompt} saja (tanpa model).
const img = (name, pos) =>
  http(name, {
    url: "={{ String($env.LLM_BASE_URL).replace(/\\/+$/, '') }}/images/generations",
    headers: [{ name: 'Authorization', value: '=Bearer {{ $env.LLM_API_KEY }}' }],
    json: '={{ JSON.stringify($json.request) }}',
    timeout: 120000,
  }, pos, true);
// Unggah biner ke Directus /files (multipart, dari properti binary "file").
const dxUpload = (name, pos, title = 'Cover AI') =>
  node(name, 'n8n-nodes-base.httpRequest', 4.2, {
    method: 'POST',
    url: '={{ $env.DIRECTUS_URL }}/files',
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Authorization', value: '=Bearer {{ $env.DIRECTUS_WRITER_TOKEN }}' }] },
    sendBody: true,
    contentType: 'multipart-form-data',
    bodyParameters: { parameters: [
      { name: 'title', value: title },
      { parameterType: 'formBinaryData', name: 'file', inputDataFieldName: 'file' },
    ] },
    options: { timeout: 60000 },
  }, pos, { onError: 'continueRegularOutput' });
const filterNode = (name, expr, pos) =>
  code(name, new Function(`return $input.all().filter((i) => ${expr});`), pos);

// ── 1. Masuk & routing ───────────────────────────────────────────────────
node('Telegram Webhook', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: WEBHOOK_PATH, options: {} }, [0, 600], {
  webhookId: WEBHOOK_ID,
});

code('Router', function () {
  // ID Telegram yang boleh memakai bot. Kirim /start ke bot untuk melihat ID-mu.
  const ALLOWED = __ALLOWED__;

  const u = $input.first().json.body || {};
  const out = (o) => [{ json: o }];

  if (u.callback_query) {
    const cq = u.callback_query;
    const chatId = cq.message?.chat?.id;
    const userId = cq.from?.id;
    if (!ALLOWED.includes(userId)) {
      return out({ action: 'reply', chatId, text: `⛔ Akun ini belum diizinkan memakai bot ERI.\nID Telegram kamu: ${userId}` });
    }
    const [cmd, draftId] = String(cq.data || '').split(':');
    // Tombol roadmap: rm:<id> (detail), rmw/rmp/rms/rmd:<id>, rmok/rmre/rmx:<idAwal>-<idAkhir> (usulan AI).
    const RM = { rm: 'rm_detail', rmw: 'rm_write', rmp: 'rm_prio', rms: 'rm_skip', rmd: 'rm_delete', rmok: 'rm_save', rmre: 'rm_redo', rmx: 'rm_discard' };
    if (RM[cmd]) {
      const base = { action: RM[cmd], chatId, callbackId: cq.id, messageId: cq.message?.message_id };
      const range = String(draftId || '').match(/^(\d+)-(\d+)$/);
      if (['rmok', 'rmre', 'rmx'].includes(cmd)) return range ? out({ ...base, from: +range[1], to: +range[2] }) : [];
      const planId = parseInt(draftId, 10);
      return planId ? out({ ...base, planId }) : [];
    }
    const action ={ img: 'imgmenu', iback: 'back', idef: 'pub_default', iai: 'pub_ai', ifoto: 'ask_photo', rev: 'ask_revision', del: 'cancel' }[cmd];
    if (!action || !draftId) return [];
    return out({ action, chatId, draftId, callbackId: cq.id, messageId: cq.message?.message_id });
  }

  const m = u.message;
  if (!m) return [];
  const chatId = m.chat.id;
  const userId = m.from?.id;
  if (!ALLOWED.includes(userId)) {
    return out({
      action: 'reply', chatId,
      text: `⛔ Akun ini belum diizinkan memakai bot ERI.\nID Telegram kamu: ${userId}\nKirim ID ini ke admin untuk didaftarkan.`,
    });
  }
  // Foto (atau gambar yang dikirim sebagai file) sebagai balasan permintaan cover → jadikan cover artikel.
  const doc = m.document && /^image\//.test(m.document.mime_type || '') ? m.document : null;
  if ((m.photo && m.photo.length) || doc) {
    const fileId = doc ? doc.file_id : m.photo[m.photo.length - 1].file_id;
    const ids = String(m.reply_to_message?.text || '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g);
    if (ids) return out({ action: 'photo_cover', chatId, draftId: ids[ids.length - 1], fileId });
    return out({ action: 'reply', chatId, text: 'Untuk memakai foto sebagai cover: pada draft tekan "🖼 Publish" → "📎 Lampirkan foto", lalu BALAS pesan itu dengan foto.' });
  }

  const text = String(m.text || '').trim();
  const help =
    '🌿 Bot Artikel ERI\n\n' +
    '✍️ Kirim ide atau poin-poin artikel dalam satu pesan teks. Contoh:\n' +
    '"Kapan usaha butuh UKL-UPL vs SPPL. Sasar pemilik pabrik kecil."\n' +
    'Bot menyusun draft (Indonesia + English) dengan tombol Publish / Revisi / Batal.\n\n' +
    '🗺 Roadmap artikel:\n' +
    '/roadmap — lihat roadmap & pilih artikel yang mau ditulis\n' +
    '/tulis — tulis rencana prioritas teratas (/tulis 7 = rencana #7)\n' +
    '/roadmapbaru <fokus> — AI mengusulkan 8 judul baru, mis. /roadmapbaru limbah B3 Gresik\n' +
    '/tambah judul | kata kunci | sudut — tambah satu rencana manual\n\n' +
    `ID Telegram kamu: ${userId}`;
  const command = text.match(/^\/([A-Za-z_]+)(?:@\w+)?\s*([\s\S]*)$/);
  if (command) {
    const c = command[1].toLowerCase();
    const arg = command[2].trim();
    if (c === 'roadmap') return out({ action: 'rm_list', chatId });
    if (c === 'tulis') return out({ action: 'rm_write', chatId, planId: parseInt(arg.replace(/^#/, ''), 10) || null });
    if (c === 'roadmapbaru') {
      if (!arg) return out({ action: 'reply', chatId, text: 'Tulis fokus roadmap-nya. Contoh:\n/roadmapbaru limbah B3 Gresik' });
      return out({ action: 'rm_new', chatId, focus: arg.replace(/\s+/g, ' ').slice(0, 60) });
    }
    if (c === 'tambah') {
      const [title, keyword, angle] = arg.split('|').map((s) => s.trim());
      if (!title) return out({ action: 'reply', chatId, text: 'Format: /tambah judul | kata kunci | sudut (kata kunci & sudut opsional)\nContoh:\n/tambah Cara Mengurus SLO IPAL | slo ipal | langkah praktis untuk pabrik' });
      return out({ action: 'rm_add', chatId, title: title.slice(0, 200), keyword: (keyword || '').toLowerCase().slice(0, 100), angle: (angle || '').slice(0, 500) });
    }
    return out({ action: 'reply', chatId, text: help });
  }
  if (!text || text.startsWith('/')) return out({ action: 'reply', chatId, text: help });

  const replied = String(m.reply_to_message?.text || '');
  const ref = replied.match(/ID draft: ([0-9a-f-]{36})/);
  if (ref) return out({ action: 'revise', chatId, draftId: ref[1], feedback: text });

  return out({ action: 'draft', chatId, notes: text });
}, [240, 600]);
link('Telegram Webhook', 'Router');

const branch = (name, actions, pos) => {
  code(name, new Function(`return $input.all().filter((i) => ${JSON.stringify(actions)}.includes(i.json.action));`), pos);
  link('Router', name);
  return name;
};

// ── 2. Balasan sederhana (bantuan / ditolak) ─────────────────────────────
branch('▶ Balasan', ['reply'], [480, 1500]);
tg('Telegram: balas', 'sendMessage', '={{ JSON.stringify({ chat_id: $json.chatId, text: $json.text }) }}', [720, 1500]);
link('▶ Balasan', 'Telegram: balas');

// ── Fungsi bersama ─────────────────────────────────────────────────────────
// Langkah 1: minta artikel Indonesia (4 tag).
function prepareId() {
  const ctx = $('Mulai draft').first().json;
  // Dari roadmap: kata kunci fokus dipakai di judul, paragraf pertama, dan satu <h2>.
  const kw = ctx.keyword
    ? `Kata kunci utama (SEO): "${ctx.keyword}". Pakai kata kunci ini apa adanya di <judul>, di paragraf pertama, dan di salah satu <h2>.\n\n`
    : '';
  return [{
    json: {
      request: {
        model: $env.LLM_MODEL,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: __SYSTEM_ID__ },
          { role: 'user', content: `Catatan dari tim ERI:\n\n${ctx.notes}\n\n${kw}Mulai LANGSUNG dari <judul>.` },
        ],
      },
    },
  }];
}
// Langkah 1 (revisi): revisi artikel Indonesia yang ada.
function prepareReviseId() {
  const cur = $input.first().json.data || {};
  const ctx = $('▶ Revisi').first().json;
  return [{
    json: {
      request: {
        model: $env.LLM_MODEL,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: __SYSTEM_ID__ },
          {
            role: 'user',
            content:
              `Artikel Bahasa Indonesia saat ini:\n<judul>${cur.title_id}</judul>\n<ringkasan>${cur.excerpt_id}</ringkasan>\n<kategori>${cur.category}</kategori>\n<isi>${cur.body_id}</isi>\n\n` +
              `Catatan revisi dari tim ERI:\n${ctx.feedback}\n\n` +
              'Revisi artikel sesuai catatan, kembalikan LENGKAP dengan empat tag XML (<judul><ringkasan><kategori><isi>). Mulai dari <judul>.',
          },
        ],
      },
    },
  }];
}
// Langkah 2: minta terjemahan Inggris dari artikel Indonesia (dibaca dari node __IDNODE__).
function prepareEn() {
  const id = $('__IDNODE__').first().json.id;
  return [{
    json: {
      request: {
        model: $env.LLM_MODEL,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: __SYSTEM_EN__ },
          { role: 'user', content: `Terjemahkan ke Bahasa Inggris (pertahankan semua tag HTML di dalam isi):\n<judul>${id.judul}</judul>\n<ringkasan>${id.ringkasan}</ringkasan>\n<isi>${id.isi}</isi>` },
        ],
      },
    },
  }];
}
// Parser artikel Indonesia (4 tag). Dipakai untuk draft & revisi.
function parseId() {
  const r = $input.first().json;
  const fail = (error) => [{ json: { ok: false, error } }];
  if (r.error) {
    const msg = r.error.message || r.error.description || JSON.stringify(r.error);
    return fail('Gagal memanggil AI: ' + String(msg).slice(0, 300));
  }
  const choice = (r.choices || [])[0];
  if (!choice) return fail('Jawaban AI kosong. Cek LLM_BASE_URL, LLM_API_KEY, dan LLM_MODEL di server.');
  if (choice.finish_reason === 'content_filter') return fail('AI menolak menyusun artikel ini. Coba ubah catatannya.');
  const m = choice.message || {};
  const c = m.content;
  let text = Array.isArray(c) ? c.map((p) => (typeof p === 'string' ? p : p.text || '')).join('') : String(c || '');
  if (!text.trim() && m.reasoning_content) text = String(m.reasoning_content);
  const grab = (k) => {
    const mm = text.match(new RegExp('<' + k + '>([\\s\\S]*?)</' + k + '>', 'i'));
    return mm ? mm[1].trim() : '';
  };
  const id = { judul: grab('judul'), ringkasan: grab('ringkasan'), kategori: grab('kategori'), isi: grab('isi') };
  const missing = ['judul', 'ringkasan', 'isi'].filter((k) => !id[k]); // kategori opsional → fallback Lainnya
  if (missing.length) {
    if (choice.finish_reason === 'length') return fail('Artikel terlalu panjang sehingga terpotong. Coba persempit topiknya.');
    const snip = text.trim().slice(0, 200).replace(/\s+/g, ' ');
    return fail('Hasil AI tidak lengkap (bagian hilang: ' + missing.join(', ') + '). Cuplikan: ' + (snip || '(kosong)'));
  }
  return [{ json: { ok: true, id } }];
}
// Gabungkan artikel Indonesia (node __IDNODE__) + terjemahan Inggris ($input) → 8 kolom.
// EN bersifat best-effort: bila gagal/parsial, kolom EN memakai teks Indonesia.
function combineEn() {
  const r = $input.first().json;
  const id = $('__IDNODE__').first().json.id;
  const CATEGORIES = __CATEGORIES__;
  let en = {};
  const choice = (r.choices || [])[0];
  if (choice && !r.error) {
    const m = choice.message || {};
    let text = Array.isArray(m.content) ? m.content.map((p) => (typeof p === 'string' ? p : p.text || '')).join('') : String(m.content || '');
    if (!text.trim() && m.reasoning_content) text = String(m.reasoning_content);
    const grab = (k) => {
      const mm = text.match(new RegExp('<' + k + '>([\\s\\S]*?)</' + k + '>', 'i'));
      return mm ? mm[1].trim() : '';
    };
    en = { judul: grab('judul'), ringkasan: grab('ringkasan'), isi: grab('isi') };
  }
  const keepSlug = __KEEPSLUG__;
  const slug = keepSlug || String(id.judul || 'artikel')
    .toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 70).replace(/-+$/, '');
  const article = {
    title_id: id.judul, title_en: en.judul || id.judul,
    excerpt_id: id.ringkasan, excerpt_en: en.ringkasan || id.ringkasan,
    body_id: id.isi, body_en: en.isi || id.isi,
    slug,
    category: CATEGORIES.find((x) => (id.kategori || '').toLowerCase().includes(x.toLowerCase())) || 'Lainnya',
  };
  return [{ json: { ok: true, article } }];
}
function previewMessage() {
  // Dipakai setelah Directus menyimpan/memperbarui draft.
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const saved = $input.first().json;
  const ctx = $('__CTX__').first().json;
  const chatId = $('__ROUTE__').first().json.chatId;
  if (!saved.data?.id) {
    const err = saved.error?.message || JSON.stringify(saved.error || saved);
    return [{ json: { body: { chat_id: chatId, text: '⚠️ Gagal menyimpan draft ke CMS: ' + String(err).slice(0, 300) } } }];
  }
  const a = { ...saved.data, ...ctx.article };
  const id = saved.data.id;
  const words = String(a.body_id || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const enSama = a.body_en === a.body_id ? '\n⚠️ Terjemahan Inggris gagal — kolom EN sementara memakai teks Indonesia. Bisa diperbaiki lewat Revisi atau di CMS.\n' : '';
  const text =
    `📝 <b>${'__LABEL__'}</b>\n\n` +
    `<b>${esc(a.title_id)}</b>\n<i>${esc(a.title_en)}</i>\n\n` +
    `🏷 ${esc(a.category)} · ±${words} kata\n${enSama}\n` +
    `${esc(a.excerpt_id)}\n\n` +
    `🔗 Baca lengkap: <a href="${__CMS__}/admin/content/articles/${id}">buka di CMS</a>\n\n` +
    'Pilih tindakan:';
  return [{
    json: {
      body: {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[
            { text: '🖼 Publish', callback_data: `img:${id}` },
            { text: '✏️ Revisi', callback_data: `rev:${id}` },
            { text: '🗑 Batal', callback_data: `del:${id}` },
          ]],
        },
      },
    },
  }];
}
const sendBody = '={{ JSON.stringify($json.body) }}';
const errorBody = (route) =>
  `={{ JSON.stringify({ chat_id: $('${route}').first().json.chatId, text: '⚠️ ' + $json.error }) }}`;

// ── 3. Draft baru (dua langkah: tulis ID → terjemah EN → gabung) ───────────
branch('▶ Draft baru', ['draft'], [480, 0]);
// Titik masuk bersama: pesan teks bebas (▶ Draft baru) & rencana roadmap (✓ Rencana siap).
// Item: { chatId, notes, planId?, keyword?, planTitle? }.
code('Mulai draft', function () { return $input.all(); }, [600, 0]);
tg('Telegram: sedang menyusun', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $json.chatId, text: '⏳ Menyusun artikel' + ($json.planTitle ? ' “' + $json.planTitle + '”' : '') + ' (Indonesia lalu terjemahannya)… biasanya 2–3 menit.' }) }}`,
  [720, 0], true);
code('Siapkan prompt ID', prepareId, [960, 0]);
llm('AI: tulis ID', [1200, 0]);
code('Olah ID', parseId, [1440, 0]);
filterNode('✓ ID valid', 'i.json.ok', [1680, 0]);
filterNode('✗ ID gagal', '!i.json.ok', [1680, 220]);
tg('Telegram: gagal draft', 'sendMessage', errorBody('Mulai draft'), [1920, 220]);
codeX('Siapkan prompt EN', prepareEn, { __IDNODE__: 'Olah ID' }, [1920, 0]);
llm('AI: terjemah EN', [2160, 0]);
codeX('Gabung draft', combineEn, { __IDNODE__: 'Olah ID', __KEEPSLUG__: 'null' }, [2400, 0]);
dx('Directus: cek slug', 'GET', '/items/articles', {
  query: [
    { name: 'filter[slug][_starts_with]', value: '={{ $json.article.slug }}' },
    { name: 'fields', value: 'slug' },
    { name: 'limit', value: '-1' },
  ],
}, [2640, 0], true);
code('Tentukan slug unik', function () {
  const base = $('Gabung draft').first().json.article;
  const taken = new Set(($input.first().json.data || []).map((x) => x.slug));
  let slug = base.slug;
  for (let n = 2; taken.has(slug); n++) slug = `${base.slug}-${n}`;
  return [{ json: { article: { ...base, slug, status: 'draft' } } }];
}, [2880, 0]);
dx('Directus: simpan draft', 'POST', '/items/articles', {
  json: '={{ JSON.stringify($json.article) }}',
}, [3120, 0], true);
codeX('Susun pratinjau draft', previewMessage,
  { __CTX__: 'Tentukan slug unik', __ROUTE__: 'Mulai draft', __LABEL__: 'Draft siap ditinjau' }, [3360, 0]);
tg('Telegram: kirim pratinjau', 'sendMessage', sendBody, [3600, 0]);
// Draft dari roadmap → rencana jadi 📝 draft + tertaut ke artikelnya.
code('Rencana jadi draft?', function () {
  const ctx = $('Mulai draft').first().json;
  const saved = $('Directus: simpan draft').first().json.data;
  if (!ctx.planId || !saved || !saved.id) return [];
  return [{ json: { planId: ctx.planId, article: saved.id } }];
}, [3840, 0]);
dx('Directus: rencana → draft', 'PATCH', '/items/article_plans/{{ $json.planId }}', {
  json: `={{ JSON.stringify({ status: 'draft', article: $json.article }) }}`,
}, [4080, 0], true);
link('▶ Draft baru', 'Mulai draft', 'Telegram: sedang menyusun', 'Siapkan prompt ID', 'AI: tulis ID', 'Olah ID');
link('Olah ID', '✓ ID valid', 'Siapkan prompt EN', 'AI: terjemah EN', 'Gabung draft',
  'Directus: cek slug', 'Tentukan slug unik', 'Directus: simpan draft', 'Susun pratinjau draft', 'Telegram: kirim pratinjau',
  'Rencana jadi draft?', 'Directus: rencana → draft');
link('Olah ID', '✗ ID gagal', 'Telegram: gagal draft');

// ── 4. Revisi (dua langkah) ────────────────────────────────────────────────
branch('▶ Revisi', ['revise'], [480, 500]);
tg('Telegram: sedang merevisi', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $json.chatId, text: '⏳ Merevisi artikel lalu menerjemahkan… biasanya 2–3 menit.' }) }}`, [720, 500], true);
dx('Directus: ambil draft', 'GET', `/items/articles/{{ $('▶ Revisi').first().json.draftId }}`, {}, [960, 500], true);
code('Siapkan revisi ID', prepareReviseId, [1200, 500]);
llm('AI: revisi ID', [1440, 500]);
code('Olah revisi ID', parseId, [1680, 500]);
filterNode('✓ Revisi valid', 'i.json.ok', [1920, 500]);
filterNode('✗ Revisi gagal', '!i.json.ok', [1920, 720]);
tg('Telegram: gagal revisi', 'sendMessage', errorBody('▶ Revisi'), [2160, 720]);
codeX('Siapkan revisi EN', prepareEn, { __IDNODE__: 'Olah revisi ID' }, [2160, 500]);
llm('AI: terjemah revisi', [2400, 500]);
codeX('Gabung revisi', combineEn,
  { __IDNODE__: 'Olah revisi ID', __KEEPSLUG__: "$('Directus: ambil draft').first().json.data?.slug" }, [2640, 500]);
dx('Directus: perbarui draft', 'PATCH', `/items/articles/{{ $('▶ Revisi').first().json.draftId }}`, {
  json: '={{ JSON.stringify($json.article) }}',
}, [2880, 500], true);
codeX('Susun pratinjau revisi', previewMessage,
  { __CTX__: 'Gabung revisi', __ROUTE__: '▶ Revisi', __LABEL__: 'Draft sudah direvisi' }, [3120, 500]);
tg('Telegram: kirim pratinjau revisi', 'sendMessage', sendBody, [3360, 500]);
link('▶ Revisi', 'Telegram: sedang merevisi', 'Directus: ambil draft', 'Siapkan revisi ID', 'AI: revisi ID', 'Olah revisi ID');
link('Olah revisi ID', '✓ Revisi valid', 'Siapkan revisi EN', 'AI: terjemah revisi', 'Gabung revisi',
  'Directus: perbarui draft', 'Susun pratinjau revisi', 'Telegram: kirim pratinjau revisi');
link('Olah revisi ID', '✗ Revisi gagal', 'Telegram: gagal revisi');

// ── 5. Tombol Revisi → minta catatan ─────────────────────────────────────
branch('▶ Minta revisi', ['ask_revision'], [480, 950]);
tg('Telegram: jawab tombol revisi', 'answerCallbackQuery',
  '={{ JSON.stringify({ callback_query_id: $json.callbackId }) }}', [720, 950], true);
tg('Telegram: minta catatan', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Minta revisi').first().json.chatId, text: '✏️ Balas pesan ini dengan catatan revisi.\\n\\nID draft: ' + $('▶ Minta revisi').first().json.draftId, reply_markup: { force_reply: true, input_field_placeholder: 'Catatan revisi…' } }) }}`,
  [960, 950]);
link('▶ Minta revisi', 'Telegram: jawab tombol revisi', 'Telegram: minta catatan');

// ── 6. Pilih gambar → publish ──────────────────────────────────────────────
// Fungsi bersama untuk cabang gambar.
function coverDefault() {
  const ctx = $('▶ Default kategori').first().json;
  const d = $input.first().json.data || {};
  const DEFAULT_COVERS = __DEFAULT_COVERS__;
  const cover = DEFAULT_COVERS[d.category] || DEFAULT_COVERS['Lainnya'];
  return [{ json: { draftId: ctx.draftId, chatId: ctx.chatId, messageId: ctx.messageId, cover, note: '🎨 Cover: gambar default kategori.' } }];
}
function preparePicture() {
  const d = $('Directus: ambil draft AI').first().json.data || {};
  const title = d.title_en || d.title_id || 'environmental consulting';
  return [{ json: { request: { prompt: `Professional editorial cover photograph for an article titled "${title}". Indonesian environmental consulting, topic ${d.category || 'environment'}. Realistic corporate photography, clean composition, green and neutral tones, natural light. No text, no words, no logo, no watermark.` } } }];
}
async function prepPicUpload() {
  const r = $input.first().json;
  const b64 = (!r.error && r.data && r.data[0] && r.data[0].b64_json) ? r.data[0].b64_json : '';
  if (!b64) return [{ json: { ok: false } }];
  const bin = await this.helpers.prepareBinaryData(Buffer.from(b64, 'base64'), 'cover.jpg', 'image/jpeg');
  return [{ json: { ok: true }, binary: { file: bin } }];
}
function coverAI() {
  const up = $input.first().json;
  const ctx = $('▶ AI gambar').first().json;
  const d = $('Directus: ambil draft AI').first().json.data || {};
  const DEFAULT_COVERS = __DEFAULT_COVERS__;
  const aiOk = !!(up && up.data && up.data.id);
  const cover = aiOk ? up.data.id : (DEFAULT_COVERS[d.category] || DEFAULT_COVERS['Lainnya']);
  const note = aiOk ? '🤖 Cover: gambar buatan AI.' : 'ℹ️ Gambar AI gagal dibuat (layanan gambar sedang sibuk) — dipakai cover default kategori.';
  return [{ json: { draftId: ctx.draftId, chatId: ctx.chatId, messageId: ctx.messageId, cover, aiOk, note } }];
}
// Foto hasil unduhan dari Telegram → beri nama & tipe gambar yang benar (Telegram
// mengirim application/octet-stream, padahal Directus butuh image/* untuk transformasi).
function preparePhotoUpload() {
  const item = $input.first();
  const filePath = String($('Telegram: getFile').first().json.result?.file_path || '');
  const bin = item.binary && item.binary.file;
  if (!bin) return [{ json: { downloadError: 'Gagal mengunduh foto dari Telegram. Coba kirim ulang.' } }];
  const ext = (filePath.match(/\.(jpe?g|png|webp|gif|heic)$/i) || [, 'jpg'])[1].toLowerCase();
  const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic' }[ext];
  return [{ json: {}, binary: { file: { ...bin, mimeType: mime, fileName: `cover-telegram.${ext}`, fileExtension: ext } } }];
}
// Foto kiriman admin. Gagal → ok:false (TIDAK dipublish; admin diberi pilihan lagi).
function coverFoto() {
  const up = $input.first().json;
  const ctx = $('▶ Foto cover').first().json;
  const prep = $('Siapkan unggah foto').first().json;
  if (!prep.downloadError && up && up.data && up.data.id) {
    return [{ json: { ok: true, draftId: ctx.draftId, chatId: ctx.chatId, messageId: null, cover: up.data.id, note: '🖼 Cover: foto kiriman kamu.' } }];
  }
  let error = prep.downloadError || (up && up.error && (up.error.message || up.error.description)) || JSON.stringify((up && up.error) || up || {});
  // Error HTTP n8n berbentuk: 503 - "{\"errors\":[{\"message\":\"...\"}]}" → ambil pesan aslinya.
  try {
    const s = String(error);
    const o = JSON.parse(JSON.parse(s.slice(s.indexOf('"'), s.lastIndexOf('"') + 1)));
    if (o.errors && o.errors[0] && o.errors[0].message) error = s.split(' ')[0] + ' ' + o.errors[0].message;
  } catch { /* bukan format itu, pakai apa adanya */ }
  error = String(error).replace(/bot\d+:[\w-]+/g, 'bot…').slice(0, 250);
  return [{ json: { ok: false, draftId: ctx.draftId, chatId: ctx.chatId, error } }];
}
// Minta prompt gambar ke AI (panggilan kecil, satu tag) dari data draft.
function preparePhotoPrompt() {
  const d = $input.first().json.data || {};
  const plain = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return [{
    json: {
      request: {
        model: $env.LLM_MODEL,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: __SYSTEM_IMG__ },
          {
            role: 'user',
            content:
              `Article title: ${plain(d.title_en || d.title_id)}\nSummary: ${plain(d.excerpt_en || d.excerpt_id)}\nCategory: ${d.category || 'Lainnya'}\n\n` +
              'Write the cover photo prompt. Start directly with <prompt>.',
          },
        ],
      },
    },
  }];
}
// Ambil <prompt> dari jawaban AI; gagal/kurang → template. Susun pesan Telegram (force_reply).
function photoPromptMessage() {
  const r = $input.first().json;
  const ctx = $('▶ Minta foto').first().json;
  const d = $('Directus: ambil draft foto').first().json.data || {};
  const SCENES = __SCENES__;
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const plain = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  let prompt = '';
  const choice = (r && !r.error && r.choices || [])[0];
  if (choice) {
    const m = choice.message || {};
    let text = Array.isArray(m.content) ? m.content.map((p) => (typeof p === 'string' ? p : p.text || '')).join('') : String(m.content || '');
    if (!text.trim() && m.reasoning_content) text = String(m.reasoning_content);
    const mm = text.match(/<prompt>([\s\S]*?)<\/prompt>/i);
    prompt = mm ? plain(mm[1]).replace(/^["'`]+|["'`]+$/g, '') : '';
  }
  const fromAi = prompt.length >= 60 && prompt.length <= 1500;
  if (!fromAi) {
    const title = plain(d.title_en || d.title_id) || 'environmental compliance';
    prompt =
      `Photorealistic editorial cover photograph for an article titled "${title}". ` +
      `Scene: ${SCENES[d.category] || SCENES['Lainnya']}. ` +
      'Setting: Indonesia (East Java), tropical daylight. Style: professional corporate photography, natural light, clean composition, green and neutral tones, shallow depth of field. ' +
      '16:9 landscape, photorealistic, no text, no logos, no watermark.';
  } else if (!/no text/i.test(prompt)) {
    prompt += ' 16:9 landscape, photorealistic, no text, no logos, no watermark.';
  }

  const text =
    '🎨 <b>Prompt gambar</b> — ketuk blok di bawah untuk menyalin, lalu tempel di ChatGPT / Gemini / Midjourney:\n\n' +
    `<pre>${esc(prompt)}</pre>\n\n` +
    (fromAi ? '' : '<i>(prompt dari template — AI sedang tidak tersedia)</i>\n\n') +
    '📎 Setelah gambarnya jadi, <b>BALAS pesan ini</b> dengan gambarnya (boleh sebagai foto atau file).\n\n' +
    `(draft: ${ctx.draftId})`;
  return [{
    json: {
      fromAi,
      body: {
        chat_id: ctx.chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: { force_reply: true, input_field_placeholder: 'Kirim satu gambar…' },
      },
    },
  }];
}
function assemblePublish() { return $input.all(); }

// 6a. Klik "🖼 Publish" → tampilkan menu pilihan gambar.
branch('▶ Menu gambar', ['imgmenu'], [480, 1150]);
tg('Telegram: jawab menu', 'answerCallbackQuery', '={{ JSON.stringify({ callback_query_id: $json.callbackId }) }}', [720, 1100], true);
tg('Telegram: tampil menu gambar', 'editMessageReplyMarkup',
  `={{ JSON.stringify({ chat_id: $('▶ Menu gambar').first().json.chatId, message_id: $('▶ Menu gambar').first().json.messageId, reply_markup: { inline_keyboard: [[{ text: '🎨 Default kategori', callback_data: 'idef:' + $('▶ Menu gambar').first().json.draftId }, { text: '🤖 AI buatkan', callback_data: 'iai:' + $('▶ Menu gambar').first().json.draftId }], [{ text: '📎 Lampirkan foto', callback_data: 'ifoto:' + $('▶ Menu gambar').first().json.draftId }, { text: '← Kembali', callback_data: 'iback:' + $('▶ Menu gambar').first().json.draftId }]] } }) }}`,
  [960, 1150], true);
link('▶ Menu gambar', 'Telegram: jawab menu', 'Telegram: tampil menu gambar');

// 6b. "← Kembali" → tombol utama lagi.
branch('▶ Kembali', ['back'], [480, 1320]);
tg('Telegram: jawab kembali', 'answerCallbackQuery', '={{ JSON.stringify({ callback_query_id: $json.callbackId }) }}', [720, 1320], true);
tg('Telegram: tombol utama', 'editMessageReplyMarkup',
  `={{ JSON.stringify({ chat_id: $('▶ Kembali').first().json.chatId, message_id: $('▶ Kembali').first().json.messageId, reply_markup: { inline_keyboard: [[{ text: '🖼 Publish', callback_data: 'img:' + $('▶ Kembali').first().json.draftId }, { text: '✏️ Revisi', callback_data: 'rev:' + $('▶ Kembali').first().json.draftId }, { text: '🗑 Batal', callback_data: 'del:' + $('▶ Kembali').first().json.draftId }]] } }) }}`,
  [960, 1320], true);
link('▶ Kembali', 'Telegram: jawab kembali', 'Telegram: tombol utama');

// 6c. Default kategori.
branch('▶ Default kategori', ['pub_default'], [480, 1550]);
tg('Telegram: jawab default', 'answerCallbackQuery', `={{ JSON.stringify({ callback_query_id: $json.callbackId, text: 'Memasang gambar default…' }) }}`, [720, 1550], true);
dx('Directus: ambil kategori', 'GET', `/items/articles/{{ $('▶ Default kategori').first().json.draftId }}`, { query: [{ name: 'fields', value: 'category' }] }, [960, 1550], true);
code('Cover default', coverDefault, [1200, 1550]);
link('▶ Default kategori', 'Telegram: jawab default', 'Directus: ambil kategori', 'Cover default', 'Siapkan publish');

// 6d. AI buatkan (best-effort; gagal → cover default).
branch('▶ AI gambar', ['pub_ai'], [480, 1720]);
tg('Telegram: jawab AI', 'answerCallbackQuery', `={{ JSON.stringify({ callback_query_id: $json.callbackId, text: 'Membuat gambar AI…' }) }}`, [720, 1720], true);
dx('Directus: ambil draft AI', 'GET', `/items/articles/{{ $('▶ AI gambar').first().json.draftId }}`, { query: [{ name: 'fields', value: 'category,title_id,title_en' }] }, [960, 1720], true);
code('Siapkan prompt gambar', preparePicture, [1200, 1720]);
img('AI: buat gambar', [1440, 1720]);
code('Olah gambar AI', prepPicUpload, [1680, 1720]);
dxUpload('Directus: unggah AI', [1920, 1720]);
code('Cover AI', coverAI, [2160, 1720]);
link('▶ AI gambar', 'Telegram: jawab AI', 'Directus: ambil draft AI', 'Siapkan prompt gambar', 'AI: buat gambar', 'Olah gambar AI', 'Directus: unggah AI', 'Cover AI', 'Siapkan publish');

// 6e. Lampirkan foto → kirim prompt gambar siap tempel + minta user membalas dengan foto.
branch('▶ Minta foto', ['ask_photo'], [480, 1950]);
tg('Telegram: jawab minta foto', 'answerCallbackQuery', `={{ JSON.stringify({ callback_query_id: $json.callbackId, text: 'Menyiapkan prompt gambar…' }) }}`, [720, 1950], true);
tg('Telegram: info siapkan prompt', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Minta foto').first().json.chatId, text: '⏳ Menyiapkan prompt gambar untuk artikel ini… (±30 detik)' }) }}`, [960, 1950], true);
dx('Directus: ambil draft foto', 'GET', `/items/articles/{{ $('▶ Minta foto').first().json.draftId }}`,
  { query: [{ name: 'fields', value: 'category,title_id,title_en,excerpt_id,excerpt_en' }] }, [1200, 1950], true);
code('Siapkan prompt foto', preparePhotoPrompt, [1440, 1950]);
llm('AI: prompt gambar', [1680, 1950], 90000);
code('Susun pesan prompt', photoPromptMessage, [1920, 1950]);
tg('Telegram: minta foto', 'sendMessage', sendBody, [2160, 1950]);
link('▶ Minta foto', 'Telegram: jawab minta foto', 'Telegram: info siapkan prompt', 'Directus: ambil draft foto',
  'Siapkan prompt foto', 'AI: prompt gambar', 'Susun pesan prompt', 'Telegram: minta foto');

// 6f. Foto diterima → import ke Directus → publish. Gagal → tidak dipublish, tawarkan pilihan lagi.
branch('▶ Foto cover', ['photo_cover'], [480, 2120]);
tg('Telegram: info memasang foto', 'sendMessage', `={{ JSON.stringify({ chat_id: $('▶ Foto cover').first().json.chatId, text: '🖼 Memasang foto & mempublish…' }) }}`, [720, 2120], true);
tg('Telegram: getFile', 'getFile', `={{ JSON.stringify({ file_id: $('▶ Foto cover').first().json.fileId }) }}`, [960, 2120], true);
// n8n sendiri yang mengunduh foto lalu mengunggahnya ke Directus. JANGAN pakai Directus
// /files/import: Directus (Node 22) memakai batas 250 ms per percobaan koneksi, padahal
// RTT server → Telegram ±275 ms, sehingga ±50% impor gagal (AggregateError ETIMEDOUT).
node('Telegram: unduh foto', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'GET',
  url: `=https://api.telegram.org/file/bot{{ $env.TELEGRAM_BOT_TOKEN }}/{{ $('Telegram: getFile').first().json.result.file_path }}`,
  options: { timeout: 60000, response: { response: { responseFormat: 'file', outputPropertyName: 'file' } } },
}, [1200, 2120], { onError: 'continueRegularOutput', retryOnFail: true, maxTries: 3, waitBetweenTries: 2000 });
code('Siapkan unggah foto', preparePhotoUpload, [1440, 2120]);
dxUpload('Directus: unggah foto', [1680, 2120], 'Cover dari Telegram');
code('Cover foto', coverFoto, [1920, 2120]);
filterNode('✓ Foto terpasang', 'i.json.ok', [2160, 2120]);
filterNode('✗ Foto gagal', '!i.json.ok', [2160, 2300]);
tg('Telegram: foto gagal', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $json.chatId, text: '⚠️ Gagal memasang foto: ' + $json.error + '\\n\\nArtikel BELUM dipublish. Pilih cover lain, atau balas pesan ini dengan gambar lain.\\n\\n(draft: ' + $json.draftId + ')', reply_markup: { inline_keyboard: [[{ text: '🎨 Default kategori', callback_data: 'idef:' + $json.draftId }, { text: '🤖 AI buatkan', callback_data: 'iai:' + $json.draftId }], [{ text: '📎 Lampirkan foto lagi', callback_data: 'ifoto:' + $json.draftId }]] } }) }}`,
  [2400, 2300], true);
link('▶ Foto cover', 'Telegram: info memasang foto', 'Telegram: getFile', 'Telegram: unduh foto', 'Siapkan unggah foto', 'Directus: unggah foto', 'Cover foto');
link('Cover foto', '✓ Foto terpasang', 'Siapkan publish');
link('Cover foto', '✗ Foto gagal', 'Telegram: foto gagal');

// 6g. Publish bersama (semua cabang gambar menuju sini).
code('Siapkan publish', assemblePublish, [2500, 1720]);
dx('Directus: publish (cover)', 'PATCH', `/items/articles/{{ $json.draftId }}`, {
  json: `={{ JSON.stringify({ status: 'published', published_at: new Date().toISOString(), cover: $json.cover }) }}`,
}, [2740, 1720], true);
tg('Telegram: hapus tombol pub', 'editMessageReplyMarkup',
  `={{ JSON.stringify({ chat_id: $('Siapkan publish').first().json.chatId, message_id: $('Siapkan publish').first().json.messageId, reply_markup: { inline_keyboard: [] } }) }}`,
  [2980, 1720], true);
tg('Telegram: info publish', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('Siapkan publish').first().json.chatId, text: $('Directus: publish (cover)').first().json.data?.slug ? '✅ Dipublish! Website diperbarui otomatis, tayang ±3 menit:\\n' + ${JSON.stringify(SITE)} + '/id/articles/' + $('Directus: publish (cover)').first().json.data.slug + '/' + ($('Siapkan publish').first().json.note ? '\\n\\n' + $('Siapkan publish').first().json.note : '') : '⚠️ Gagal mempublish (draft mungkin sudah dihapus).' }) }}`,
  [3220, 1720]);
// Catat ke roadmap: rencana tertaut → ✅ tayang; artikel tanpa rencana → baris baru "Di luar roadmap".
// Best-effort: gagal di sini tidak memengaruhi artikel yang sudah tayang.
dx('Directus: cari rencana (publish)', 'GET', '/items/article_plans', {
  query: [
    { name: 'filter[article][_eq]', value: "={{ $('Siapkan publish').first().json.draftId }}" },
    { name: 'fields', value: 'id' },
    { name: 'limit', value: '1' },
  ],
}, [3460, 1720], true);
code('Catat roadmap (publish)', function () {
  const r = $input.first().json;
  const pub = $('Directus: publish (cover)').first().json.data;
  if (r.error || !pub || !pub.id || pub.status !== 'published') return []; // roadmap belum ada / publish gagal
  const found = (r.data || [])[0];
  if (found) return [{ json: { mode: 'update', planId: found.id } }];
  return [{ json: { mode: 'create', body: { title: pub.title_id, roadmap: 'Di luar roadmap', status: 'tayang', article: pub.id } } }];
}, [3700, 1720]);
filterNode('✓ Rencana ada', "i.json.mode === 'update'", [3940, 1640]);
filterNode('✓ Rencana baru', "i.json.mode === 'create'", [3940, 1800]);
dx('Directus: rencana → tayang', 'PATCH', '/items/article_plans/{{ $json.planId }}', {
  json: `={{ JSON.stringify({ status: 'tayang' }) }}`,
}, [4180, 1640], true);
dx('Directus: catat di luar roadmap', 'POST', '/items/article_plans', { json: '={{ JSON.stringify($json.body) }}' }, [4180, 1800], true);
link('Siapkan publish', 'Directus: publish (cover)', 'Telegram: hapus tombol pub', 'Telegram: info publish',
  'Directus: cari rencana (publish)', 'Catat roadmap (publish)');
link('Catat roadmap (publish)', '✓ Rencana ada', 'Directus: rencana → tayang');
link('Catat roadmap (publish)', '✓ Rencana baru', 'Directus: catat di luar roadmap');

// ── 7. Tombol Batal ───────────────────────────────────────────────────────
branch('▶ Batal', ['cancel'], [480, 1350]);
tg('Telegram: jawab tombol batal', 'answerCallbackQuery',
  '={{ JSON.stringify({ callback_query_id: $json.callbackId, text: "Draft dibatalkan" }) }}', [720, 1350], true);
tg('Telegram: hapus tombol (batal)', 'editMessageReplyMarkup',
  `={{ JSON.stringify({ chat_id: $('▶ Batal').first().json.chatId, message_id: $('▶ Batal').first().json.messageId, reply_markup: { inline_keyboard: [] } }) }}`,
  [960, 1350], true);
tg('Telegram: info batal', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Batal').first().json.chatId, text: '🗑 Draft dibatalkan dan dihapus dari CMS.' }) }}`, [1200, 1350], true);
// Cari rencana tertaut SEBELUM menghapus (relasi SET NULL mengosongkan tautannya).
dx('Directus: cari rencana (batal)', 'GET', '/items/article_plans', {
  query: [
    { name: 'filter[article][_eq]', value: "={{ $('▶ Batal').first().json.draftId }}" },
    { name: 'fields', value: 'id' },
    { name: 'limit', value: '1' },
  ],
}, [1440, 1350], true);
dx('Directus: hapus draft', 'DELETE', `/items/articles/{{ $('▶ Batal').first().json.draftId }}`, {}, [1680, 1350], true);
code('Rencana kembali?', function () {
  const found = ($('Directus: cari rencana (batal)').first().json.data || [])[0];
  return found ? [{ json: { planId: found.id } }] : [];
}, [1920, 1350]);
dx('Directus: rencana → rencana', 'PATCH', '/items/article_plans/{{ $json.planId }}', {
  json: `={{ JSON.stringify({ status: 'rencana', article: null }) }}`,
}, [2160, 1350], true);
link('▶ Batal', 'Telegram: jawab tombol batal', 'Telegram: hapus tombol (batal)', 'Telegram: info batal',
  'Directus: cari rencana (batal)', 'Directus: hapus draft', 'Rencana kembali?', 'Directus: rencana → rencana');

// ── 8. Roadmap artikel (koleksi Directus `article_plans`) ──────────────────
// Status: usulan (hasil AI, belum disimpan) → rencana → draft → tayang | dilewati.
// Prioritas = kolom `sort` (kecil = dulu). Callback memakai id angka: rm:12.
const PLANS = '/items/article_plans';
VARS.__ESC__ = "const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');";
const editMsg = (name, pos) => tg(name, 'editMessageText', sendBody, pos, true);
const answer = (name, text, pos) =>
  tg(name, 'answerCallbackQuery', `={{ JSON.stringify({ callback_query_id: $json.callbackId${text ? `, text: ${JSON.stringify(text)}` : ''} }) }}`, pos, true);
const dropButtons = (name, route, pos) =>
  tg(name, 'editMessageReplyMarkup',
    `={{ JSON.stringify({ chat_id: $('${route}').first().json.chatId, message_id: $('${route}').first().json.messageId, reply_markup: { inline_keyboard: [] } }) }}`, pos, true);
// Filter usulan AI satu batch (id berurutan, hanya yang masih berstatus usulan).
const batchFilter = (route) =>
  `{ _and: [ { id: { _between: [$('${route}').first().json.from, $('${route}').first().json.to] } }, { status: { _eq: 'usulan' } } ] }`;

function roadmapList() {
  __ESC__
  const r = $input.first().json;
  const chatId = $('▶ Roadmap').first().json.chatId;
  const cut = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const reply = (text, extra = {}) => [{ json: { body: { chat_id: chatId, text, ...extra } } }];
  if (r.error) return reply('⚠️ Roadmap belum bisa dibaca dari CMS: ' + String(r.error.message || JSON.stringify(r.error)).slice(0, 200));
  const items = r.data || [];
  if (!items.length) return reply('🗺 Roadmap masih kosong.\n\nBuat dengan /roadmapbaru <fokus>, mis. /roadmapbaru limbah B3 Gresik — atau tambah satu dengan /tambah judul | kata kunci.');

  const prio = (a, b) => (a.sort ?? 1e9) - (b.sort ?? 1e9) || a.id - b.id;
  const groups = new Map();
  for (const p of [...items].sort((a, b) => a.id - b.id)) {
    const g = p.roadmap || 'Tanpa nama';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(p);
  }
  const names = [...groups.keys()].sort((a, b) => (a === 'Di luar roadmap') - (b === 'Di luar roadmap'));
  const count = (s) => items.filter((p) => p.status === s).length;
  const todo = items.filter((p) => p.status === 'rencana').sort(prio);
  const skipped = items.filter((p) => p.status === 'dilewati');
  // level 0 = lengkap; 1 = artikel tayang diringkas; 2 = tanpa kata kunci & judul dipendekkan.
  const render = (level) => {
    const w = level >= 2 ? 45 : 70;
    let t = `🗺 <b>Roadmap artikel ERI</b>\n✅ Tayang ${count('tayang')} · 📝 Draft ${count('draft')} · ⏳ Rencana ${count('rencana')}` +
      (skipped.length ? ` · ⏭ ${skipped.length}` : '') + '\n';
    for (const g of names) {
      const ps = groups.get(g);
      t += `\n<b>${esc(g)}</b>\n`;
      const done = ps.filter((p) => p.status === 'tayang');
      if (level === 0) for (const p of done) t += `✅ ${esc(cut(p.title, w))}\n`;
      else if (done.length) t += `✅ ${done.length} artikel tayang\n`;
      for (const p of ps.filter((p) => p.status === 'draft')) t += `📝 #${p.id} ${esc(cut(p.title, w))}\n`;
      for (const p of ps.filter((p) => p.status === 'rencana').sort(prio)) {
        t += `⏳ <b>#${p.id}</b> ${esc(cut(p.title, w))}${p.keyword && level < 2 ? ` <i>(${esc(p.keyword)})</i>` : ''}\n`;
      }
      for (const p of ps.filter((p) => p.status === 'dilewati')) t += `⏭ #${p.id} ${esc(cut(p.title, w))}\n`;
    }
    t += '\n' + (todo.length ? `Prioritas teratas: <b>#${todo[0].id}</b> → /tulis\n` : '') +
      'Ketuk tombol di bawah untuk menulis atau memprioritaskan.\n/roadmapbaru &lt;fokus&gt; — tambah roadmap baru';
    return t;
  };
  let text = render(0);
  if (text.length > 3900) text = render(1);
  if (text.length > 3900) text = render(2);
  const buttons = [...todo.slice(0, 10), ...skipped.slice(0, Math.max(0, 12 - Math.min(todo.length, 10)))]
    .map((p) => [{ text: `${p.status === 'dilewati' ? '⏭' : '⏳'} #${p.id} · ${cut(p.title, 38)}`, callback_data: `rm:${p.id}` }]);
  if (text.length > 4000) {
    // Darurat: kirim tanpa HTML supaya tidak ada tag terpotong.
    return reply(text.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').slice(0, 4000), { reply_markup: { inline_keyboard: buttons } });
  }
  return reply(text, { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: { inline_keyboard: buttons } });
}
function planDetail() {
  __ESC__
  const r = $input.first().json;
  const ctx = $('▶ Detail rencana').first().json;
  const p = r.data;
  if (!p || !p.id) return [{ json: { body: { chat_id: ctx.chatId, text: `⚠️ Rencana #${ctx.planId} tidak ditemukan (mungkin sudah dihapus). Lihat /roadmap.` } } }];
  const ICON = { usulan: '💡', rencana: '⏳', draft: '📝', tayang: '✅', dilewati: '⏭' };
  const LABEL = { usulan: 'usulan (belum disimpan)', rencana: 'rencana', draft: 'draft — lanjutkan dari pesan pratinjaunya (Publish/Revisi)', tayang: 'sudah tayang', dilewati: 'dilewati' };
  let text = `${ICON[p.status] || '•'} <b>#${p.id} · ${esc(p.title)}</b>\n` +
    (p.keyword ? `🔑 ${esc(p.keyword)}\n` : '') +
    (p.angle ? `🧭 ${esc(p.angle)}\n` : '') +
    `🗺 ${esc(p.roadmap || '-')}\nStatus: ${LABEL[p.status] || esc(p.status)}`;
  const art = p.article && typeof p.article === 'object' ? p.article : null;
  if (art && art.slug) {
    text += p.status === 'tayang'
      ? `\n🔗 <a href="${__SITE__}/id/articles/${art.slug}/">lihat di website</a>`
      : `\n🔗 <a href="${__CMS__}/admin/content/articles/${art.id}">buka di CMS</a>`;
  }
  const kb = {
    rencana: [
      [{ text: '✍️ Tulis sekarang', callback_data: `rmw:${p.id}` }],
      [{ text: '📌 Jadikan prioritas teratas', callback_data: `rmp:${p.id}` }],
      [{ text: '⏭ Lewati', callback_data: `rms:${p.id}` }, { text: '🗑 Hapus', callback_data: `rmd:${p.id}` }],
    ],
    dilewati: [
      [{ text: '↩️ Aktifkan lagi (prioritas teratas)', callback_data: `rmp:${p.id}` }],
      [{ text: '🗑 Hapus', callback_data: `rmd:${p.id}` }],
    ],
  }[p.status];
  return [{ json: { body: { chat_id: ctx.chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...(kb ? { reply_markup: { inline_keyboard: kb } } : {}) } } }];
}
// Rencana terpilih (atau prioritas teratas) → bahan "Mulai draft".
function planToDraft() {
  const ctx = $('▶ Tulis rencana').first().json;
  const r = $input.first().json;
  const p = (r.data || [])[0];
  if (!p) {
    const why = r.error
      ? 'Roadmap belum bisa dibaca dari CMS: ' + String(r.error.message || '').slice(0, 150)
      : ctx.planId
        ? `Rencana #${ctx.planId} tidak ditemukan atau bukan berstatus ⏳ rencana. Lihat /roadmap.`
        : 'Belum ada rencana ⏳ di roadmap. Tambah dengan /roadmapbaru <fokus> atau /tambah judul | kata kunci.';
    return [{ json: { ok: false, chatId: ctx.chatId, text: '⚠️ ' + why } }];
  }
  const notes = `Judul rencana: ${p.title}` + (p.angle ? `\nSudut bahasan: ${p.angle}` : '');
  return [{ json: { ok: true, chatId: ctx.chatId, notes, planId: p.id, keyword: p.keyword || '', planTitle: p.title } }];
}
// Pesan hasil prioritas / lewati / hapus (menggantikan pesan detail rencana).
function planActionInfo() {
  const r = $input.first().json;
  const ctx = $('__ROUTE__').first().json;
  const p = r.data || {};
  const title = p.title ? ` “${p.title}”` : '';
  const MSG = {
    prio: `📌 #${ctx.planId}${title} sekarang prioritas teratas.\n\n/tulis untuk menulisnya sekarang · /roadmap untuk melihat daftar.`,
    skip: `⏭ #${ctx.planId}${title} dilewati. Bisa diaktifkan lagi dari /roadmap.`,
    del: `🗑 Rencana #${ctx.planId} dihapus dari roadmap.`,
  };
  const text = r.error ? '⚠️ Gagal: ' + String(r.error.message || JSON.stringify(r.error)).slice(0, 200) : MSG['__KIND__'];
  return [{ json: { body: { chat_id: ctx.chatId, message_id: ctx.messageId, text } } }];
}
function preparePlanAdd() {
  const ctx = $('▶ Tambah rencana').first().json;
  const top = ($input.first().json.data || [])[0];
  const sort = (top && typeof top.sort === 'number' ? top.sort : 0) + 10;
  return [{ json: { body: { title: ctx.title, keyword: ctx.keyword || null, angle: ctx.angle || null, roadmap: 'Tambahan manual', status: 'rencana', sort } } }];
}
function planAddInfo() {
  const r = $input.first().json;
  const ctx = $('▶ Tambah rencana').first().json;
  const p = r.data;
  if (!p || !p.id) return [{ json: { body: { chat_id: ctx.chatId, text: '⚠️ Gagal menambah rencana: ' + String((r.error && r.error.message) || JSON.stringify(r)).slice(0, 200) } } }];
  return [{
    json: {
      body: {
        chat_id: ctx.chatId,
        text: `➕ Ditambahkan ke roadmap (Tambahan manual):\n#${p.id} ${p.title}${p.keyword ? `\n🔑 ${p.keyword}` : ''}\n\nPosisinya di akhir antrean.`,
        reply_markup: { inline_keyboard: [[{ text: '✍️ Tulis sekarang', callback_data: `rmw:${p.id}` }, { text: '📌 Jadikan prioritas', callback_data: `rmp:${p.id}` }]] },
      },
    },
  }];
}
function prepareRoadmapIdeas() {
  const ctx = $('Mulai roadmap baru').first().json;
  const existing = ($input.first().json.data || []).filter((p) => p.status !== 'usulan');
  const titles = existing.map((p) => p.title).filter(Boolean).slice(-80);
  return [{
    json: {
      request: {
        model: $env.LLM_MODEL,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: __SYSTEM_RM__ },
          {
            role: 'user',
            content: `Fokus roadmap: ${ctx.focus}\n\n` +
              (titles.length ? `Judul yang SUDAH ada (jangan diulang):\n- ${titles.join('\n- ')}\n\n` : '') +
              'Mulai LANGSUNG dengan <artikel>.',
          },
        ],
      },
    },
  }];
}
// Ambil blok <artikel> dari jawaban AI → baris article_plans berstatus "usulan".
function parseRoadmapIdeas() {
  const r = $input.first().json;
  const ctx = $('Mulai roadmap baru').first().json;
  const existing = ($('Directus: daftar rencana (usulan)').first().json.data || []).filter((p) => p.status !== 'usulan');
  const fail = (error) => [{ json: { ok: false, error } }];
  if (r.error) return fail('Gagal memanggil AI: ' + String(r.error.message || JSON.stringify(r.error)).slice(0, 200));
  const choice = (r.choices || [])[0];
  if (!choice) return fail('Jawaban AI kosong. Coba lagi sebentar lagi.');
  const m = choice.message || {};
  let text = Array.isArray(m.content) ? m.content.map((p) => (typeof p === 'string' ? p : p.text || '')).join('') : String(m.content || '');
  if (!text.trim() && m.reasoning_content) text = String(m.reasoning_content);
  const clean = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const grab = (b, k) => { const mm = b.match(new RegExp('<' + k + '>([\\s\\S]*?)</' + k + '>', 'i')); return mm ? clean(mm[1]) : ''; };
  const seen = new Set(existing.map((p) => String(p.title || '').toLowerCase().trim()));
  const ideas = [];
  for (const mm of text.matchAll(/<artikel>([\s\S]*?)<\/artikel>/gi)) {
    const title = grab(mm[1], 'judul').slice(0, 200);
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    ideas.push({ title, keyword: grab(mm[1], 'keyword').toLowerCase().slice(0, 100), angle: grab(mm[1], 'sudut').slice(0, 500) });
  }
  if (ideas.length < 3) {
    if (choice.finish_reason === 'length') return fail('Jawaban AI terpotong. Coba lagi.');
    return fail('AI tidak memberi daftar yang bisa dibaca (' + ideas.length + ' judul). Cuplikan: ' + (text.trim().slice(0, 150).replace(/\s+/g, ' ') || '(kosong)'));
  }
  const nums = existing.map((p) => (String(p.roadmap || '').match(/^Roadmap (\d+)/) || [])[1]).filter(Boolean).map(Number);
  const roadmap = `Roadmap ${(nums.length ? Math.max(...nums) : 0) + 1} · ${ctx.focus}`;
  const maxSort = Math.max(0, ...existing.map((p) => (typeof p.sort === 'number' ? p.sort : 0)));
  const items = ideas.slice(0, __RM_COUNT__).map((x, i) => ({ ...x, roadmap, status: 'usulan', sort: maxSort + (i + 1) * 10 }));
  return [{ json: { ok: true, roadmap, items } }];
}
function roadmapIdeasMessage() {
  __ESC__
  const r = $input.first().json;
  const ctx = $('Mulai roadmap baru').first().json;
  const u = $('Olah usulan roadmap').first().json;
  const saved = Array.isArray(r.data) ? r.data : [];
  if (!saved.length) {
    return [{ json: { body: { chat_id: ctx.chatId, text: '⚠️ Gagal menyimpan usulan ke CMS: ' + String((r.error && r.error.message) || JSON.stringify(r)).slice(0, 200) } } }];
  }
  const ids = saved.map((p) => p.id);
  const range = `${Math.min(...ids)}-${Math.max(...ids)}`;
  const list = [...saved].sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((p, i) =>
    `${i + 1}. <b>${esc(p.title)}</b>\n🔑 ${esc(p.keyword || '-')}${p.angle ? `\n<i>${esc(String(p.angle).slice(0, 200))}</i>` : ''}`).join('\n\n');
  const text = `💡 <b>Usulan ${esc(u.roadmap)}</b> — ${saved.length} judul\n\n${list}\n\n` +
    'Simpan ke roadmap? Setelah disimpan, judul yang kurang cocok bisa dilewati/dihapus satu per satu lewat /roadmap.';
  return [{
    json: {
      body: {
        chat_id: ctx.chatId, text, parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [
          [{ text: '✅ Simpan semua', callback_data: `rmok:${range}` }],
          [{ text: '🔄 Usulkan ulang', callback_data: `rmre:${range}` }, { text: '🗑 Batal', callback_data: `rmx:${range}` }],
        ] },
      },
    },
  }];
}

// 8a. /roadmap → daftar.
branch('▶ Roadmap', ['rm_list'], [480, 2600]);
dx('Directus: daftar roadmap', 'GET', PLANS, {
  query: [
    { name: 'filter[status][_neq]', value: 'usulan' },
    { name: 'fields', value: 'id,title,keyword,roadmap,status,sort' },
    { name: 'sort', value: 'id' },
    { name: 'limit', value: '-1' },
  ],
}, [720, 2600], true);
code('Susun roadmap', roadmapList, [960, 2600]);
tg('Telegram: kirim roadmap', 'sendMessage', sendBody, [1200, 2600]);
link('▶ Roadmap', 'Directus: daftar roadmap', 'Susun roadmap', 'Telegram: kirim roadmap');

// 8b. Ketuk rencana → detail + tombol aksi.
branch('▶ Detail rencana', ['rm_detail'], [480, 2780]);
answer('Telegram: jawab detail', '', [720, 2780]);
dx('Directus: ambil rencana', 'GET', `${PLANS}/{{ $('▶ Detail rencana').first().json.planId }}`, {
  query: [{ name: 'fields', value: 'id,title,keyword,angle,roadmap,status,article.id,article.slug' }],
}, [960, 2780], true);
code('Susun detail rencana', planDetail, [1200, 2780]);
tg('Telegram: kirim detail', 'sendMessage', sendBody, [1440, 2780]);
link('▶ Detail rencana', 'Telegram: jawab detail', 'Directus: ambil rencana', 'Susun detail rencana', 'Telegram: kirim detail');

// 8c. ✍️ Tulis sekarang / /tulis [#id] → pipeline draft (Mulai draft).
branch('▶ Tulis rencana', ['rm_write'], [480, 2960]);
answer('Telegram: jawab tulis', 'Mulai menulis…', [720, 2960]);
dropButtons('Telegram: tutup detail', '▶ Tulis rencana', [960, 2960]);
dx('Directus: pilih rencana', 'GET', PLANS, {
  query: [
    {
      name: 'filter',
      value: "={{ JSON.stringify($('▶ Tulis rencana').first().json.planId ? { _and: [ { id: { _eq: $('▶ Tulis rencana').first().json.planId } }, { status: { _eq: 'rencana' } } ] } : { status: { _eq: 'rencana' } }) }}",
    },
    { name: 'fields', value: 'id,title,keyword,angle' },
    { name: 'sort', value: 'sort,id' },
    { name: 'limit', value: '1' },
  ],
}, [1200, 2960], true);
code('Siapkan draft rencana', planToDraft, [1440, 2960]);
filterNode('✓ Rencana siap', 'i.json.ok', [1680, 2960]);
filterNode('✗ Rencana tidak ada', '!i.json.ok', [1680, 3100]);
tg('Telegram: rencana tidak ada', 'sendMessage', '={{ JSON.stringify({ chat_id: $json.chatId, text: $json.text }) }}', [1920, 3100]);
link('▶ Tulis rencana', 'Telegram: jawab tulis', 'Telegram: tutup detail', 'Directus: pilih rencana', 'Siapkan draft rencana');
link('Siapkan draft rencana', '✓ Rencana siap', 'Mulai draft');
link('Siapkan draft rencana', '✗ Rencana tidak ada', 'Telegram: rencana tidak ada');

// 8d. 📌 Jadikan prioritas (juga mengaktifkan lagi yang dilewati).
branch('▶ Prioritaskan', ['rm_prio'], [480, 3260]);
answer('Telegram: jawab prioritas', 'Dipindah ke urutan teratas', [720, 3260]);
dx('Directus: prioritas teratas', 'GET', PLANS, {
  query: [
    { name: 'filter[status][_in]', value: 'rencana,dilewati' },
    { name: 'filter[sort][_nnull]', value: 'true' },
    { name: 'fields', value: 'sort' },
    { name: 'sort', value: 'sort' },
    { name: 'limit', value: '1' },
  ],
}, [960, 3260], true);
dx('Directus: set prioritas', 'PATCH', `${PLANS}/{{ $('▶ Prioritaskan').first().json.planId }}`, {
  json: "={{ JSON.stringify({ status: 'rencana', sort: (typeof (($json.data || [])[0] || {}).sort === 'number' ? $json.data[0].sort : 0) - 1 }) }}",
}, [1200, 3260], true);
codeX('Info prioritas', planActionInfo, { __ROUTE__: '▶ Prioritaskan', __KIND__: 'prio' }, [1440, 3260]);
editMsg('Telegram: hasil prioritas', [1680, 3260]);
link('▶ Prioritaskan', 'Telegram: jawab prioritas', 'Directus: prioritas teratas', 'Directus: set prioritas', 'Info prioritas', 'Telegram: hasil prioritas');

// 8e. ⏭ Lewati.
branch('▶ Lewati rencana', ['rm_skip'], [480, 3420]);
answer('Telegram: jawab lewati', 'Dilewati', [720, 3420]);
dx('Directus: lewati rencana', 'PATCH', `${PLANS}/{{ $('▶ Lewati rencana').first().json.planId }}`, {
  json: `={{ JSON.stringify({ status: 'dilewati' }) }}`,
}, [960, 3420], true);
codeX('Info lewati', planActionInfo, { __ROUTE__: '▶ Lewati rencana', __KIND__: 'skip' }, [1200, 3420]);
editMsg('Telegram: hasil lewati', [1440, 3420]);
link('▶ Lewati rencana', 'Telegram: jawab lewati', 'Directus: lewati rencana', 'Info lewati', 'Telegram: hasil lewati');

// 8f. 🗑 Hapus rencana.
branch('▶ Hapus rencana', ['rm_delete'], [480, 3580]);
answer('Telegram: jawab hapus', 'Dihapus', [720, 3580]);
dx('Directus: hapus rencana', 'DELETE', `${PLANS}/{{ $('▶ Hapus rencana').first().json.planId }}`, {}, [960, 3580], true);
codeX('Info hapus', planActionInfo, { __ROUTE__: '▶ Hapus rencana', __KIND__: 'del' }, [1200, 3580]);
editMsg('Telegram: hasil hapus', [1440, 3580]);
link('▶ Hapus rencana', 'Telegram: jawab hapus', 'Directus: hapus rencana', 'Info hapus', 'Telegram: hasil hapus');

// 8g. /tambah judul | kata kunci | sudut → di akhir antrean.
branch('▶ Tambah rencana', ['rm_add'], [480, 3740]);
dx('Directus: prioritas terakhir', 'GET', PLANS, {
  query: [
    { name: 'filter[sort][_nnull]', value: 'true' },
    { name: 'fields', value: 'sort' },
    { name: 'sort', value: '-sort' },
    { name: 'limit', value: '1' },
  ],
}, [720, 3740], true);
code('Siapkan rencana baru', preparePlanAdd, [960, 3740]);
dx('Directus: simpan rencana', 'POST', PLANS, { json: '={{ JSON.stringify($json.body) }}' }, [1200, 3740], true);
code('Info tambah', planAddInfo, [1440, 3740]);
tg('Telegram: info tambah', 'sendMessage', sendBody, [1680, 3740]);
link('▶ Tambah rencana', 'Directus: prioritas terakhir', 'Siapkan rencana baru', 'Directus: simpan rencana', 'Info tambah', 'Telegram: info tambah');

// 8h. /roadmapbaru <fokus> (juga dari 🔄 Usulkan ulang) → AI usul 8 judul → simpan sbg "usulan".
branch('▶ Roadmap baru', ['rm_new'], [480, 3900]);
code('Mulai roadmap baru', function () { return $input.all(); }, [600, 3900]);
tg('Telegram: info usulan', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $json.chatId, text: '⏳ Menyusun ${RM_COUNT} usulan judul untuk fokus “' + $json.focus + '”… (±1 menit)' }) }}`, [720, 3900], true);
dx('Directus: daftar rencana (usulan)', 'GET', PLANS, {
  query: [
    { name: 'fields', value: 'title,roadmap,status,sort' },
    { name: 'sort', value: 'id' },
    { name: 'limit', value: '-1' },
  ],
}, [960, 3900], true);
code('Siapkan usulan roadmap', prepareRoadmapIdeas, [1200, 3900]);
llm('AI: usulan roadmap', [1440, 3900], 180000);
code('Olah usulan roadmap', parseRoadmapIdeas, [1680, 3900]);
filterNode('✓ Usulan valid', 'i.json.ok', [1920, 3900]);
filterNode('✗ Usulan gagal', '!i.json.ok', [1920, 4060]);
tg('Telegram: usulan gagal', 'sendMessage', errorBody('Mulai roadmap baru'), [2160, 4060]);
dx('Directus: simpan usulan', 'POST', PLANS, { json: '={{ JSON.stringify($json.items) }}' }, [2160, 3900], true);
code('Susun pesan usulan', roadmapIdeasMessage, [2400, 3900]);
tg('Telegram: kirim usulan', 'sendMessage', sendBody, [2640, 3900]);
link('▶ Roadmap baru', 'Mulai roadmap baru', 'Telegram: info usulan', 'Directus: daftar rencana (usulan)', 'Siapkan usulan roadmap', 'AI: usulan roadmap', 'Olah usulan roadmap');
link('Olah usulan roadmap', '✓ Usulan valid', 'Directus: simpan usulan', 'Susun pesan usulan', 'Telegram: kirim usulan');
link('Olah usulan roadmap', '✗ Usulan gagal', 'Telegram: usulan gagal');

// 8i. ✅ Simpan semua usulan → rencana.
branch('▶ Simpan usulan', ['rm_save'], [480, 4220]);
answer('Telegram: jawab simpan', 'Menyimpan…', [720, 4220]);
dropButtons('Telegram: tutup usulan (simpan)', '▶ Simpan usulan', [960, 4220]);
dx('Directus: usulan → rencana', 'PATCH', PLANS, {
  json: `={{ JSON.stringify({ query: { filter: ${batchFilter('▶ Simpan usulan')}, limit: -1 }, data: { status: 'rencana' } }) }}`,
}, [1200, 4220], true);
tg('Telegram: info simpan', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Simpan usulan').first().json.chatId, text: $json.error ? '⚠️ Gagal menyimpan usulan: ' + String($json.error.message || '').slice(0, 200) : (($json.data || []).length ? '✅ ' + $json.data.length + ' rencana disimpan ke ' + $json.data[0].roadmap + '.\\n\\n/roadmap untuk melihat & memilih · /tulis untuk menulis prioritas teratas' : 'Usulan ini sudah diproses sebelumnya.') }) }}`,
  [1440, 4220]);
link('▶ Simpan usulan', 'Telegram: jawab simpan', 'Telegram: tutup usulan (simpan)', 'Directus: usulan → rencana', 'Telegram: info simpan');

// 8j. 🗑 Batal usulan → hapus.
branch('▶ Buang usulan', ['rm_discard'], [480, 4380]);
answer('Telegram: jawab buang', 'Usulan dibuang', [720, 4380]);
dropButtons('Telegram: tutup usulan (buang)', '▶ Buang usulan', [960, 4380]);
dx('Directus: hapus usulan', 'DELETE', PLANS, {
  json: `={{ JSON.stringify({ query: { filter: ${batchFilter('▶ Buang usulan')}, limit: -1 } }) }}`,
}, [1200, 4380], true);
tg('Telegram: info buang', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Buang usulan').first().json.chatId, text: '🗑 Usulan dibuang. Buat lagi kapan saja dengan /roadmapbaru <fokus>.' }) }}`, [1440, 4380], true);
link('▶ Buang usulan', 'Telegram: jawab buang', 'Telegram: tutup usulan (buang)', 'Directus: hapus usulan', 'Telegram: info buang');

// 8k. 🔄 Usulkan ulang → baca fokus dari nama roadmap, buang usulan lama, ulangi 8h.
branch('▶ Usulkan ulang', ['rm_redo'], [480, 4540]);
answer('Telegram: jawab ulang', 'Menyusun ulang…', [720, 4540]);
dropButtons('Telegram: tutup usulan (ulang)', '▶ Usulkan ulang', [960, 4540]);
dx('Directus: baca usulan lama', 'GET', PLANS, {
  query: [
    { name: 'filter', value: `={{ JSON.stringify(${batchFilter('▶ Usulkan ulang')}) }}` },
    { name: 'fields', value: 'roadmap' },
    { name: 'limit', value: '1' },
  ],
}, [1200, 4540], true);
dx('Directus: hapus usulan lama', 'DELETE', PLANS, {
  json: `={{ JSON.stringify({ query: { filter: ${batchFilter('▶ Usulkan ulang')}, limit: -1 } }) }}`,
}, [1440, 4540], true);
code('Fokus ulang', function () {
  const ctx = $('▶ Usulkan ulang').first().json;
  const name = (($('Directus: baca usulan lama').first().json.data || [])[0] || {}).roadmap || '';
  const focus = name.split(' · ').slice(1).join(' · ').trim();
  return focus ? [{ json: { chatId: ctx.chatId, focus } }] : [];
}, [1680, 4540]);
link('▶ Usulkan ulang', 'Telegram: jawab ulang', 'Telegram: tutup usulan (ulang)', 'Directus: baca usulan lama', 'Directus: hapus usulan lama', 'Fokus ulang', 'Mulai roadmap baru');

// ── Tulis file ────────────────────────────────────────────────────────────
const workflow = {
  name: 'ERI — Artikel via Telegram',
  nodes,
  connections,
  active: false,
  settings: {
    executionOrder: 'v1',
    timezone: 'Asia/Jakarta',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'all',
    saveManualExecutions: true,
  },
  pinData: {},
};
const leftover = JSON.stringify(workflow).match(/__[A-Z]+__/);
if (leftover) throw new Error(`Placeholder belum terisi: ${leftover[0]}`);

const outDir = join(here, 'out');
mkdirSync(outDir, { recursive: true });
const file = join(outDir, 'eri-telegram-articles.json');
writeFileSync(file, JSON.stringify(workflow, null, 2));

console.log(`✓ Workflow ditulis: ${file}`);
console.log(`  ${nodes.length} node · ID diizinkan: ${allowed.length ? allowed.join(', ') : '(belum ada — isi di node "Router" nanti)'}`);
console.log('\nAlamat webhook (rahasia, JANGAN kirim ke chat):');
console.log(`  https://n8n.enviroresources.co.id/webhook/${WEBHOOK_PATH}`);
console.log('\nPerintah untuk server (daftarkan webhook ke Telegram), jalankan di ~/directus:');
console.log(`  set -a; . ./.env; set +a; curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" -d "url=https://n8n.enviroresources.co.id/webhook/${WEBHOOK_PATH}" -d 'allowed_updates=["message","callback_query"]'`);
