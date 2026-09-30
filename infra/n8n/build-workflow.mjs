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

// Langkah 1 — tulis artikel Bahasa Indonesia (4 tag). Prompt sengaja ringkas:
// model di gateway patuh format bila prompt pendek & satu bahasa.
const SYSTEM_ID = `Kamu penulis artikel untuk PT Enviro Resources Indonesia (ERI), konsultan lingkungan di Sidoarjo, Jawa Timur. Layanan ERI: AMDAL, UKL-UPL, SPPL, DELH/DPLH, Persetujuan Teknis air limbah & emisi, SLO, Rincian Teknis Limbah B3, Andalalin, SIPA, pelaporan RKL-RPL, audit lingkungan, pendampingan PROPER, prasarana pengolahan limbah (IPAL), pengelolaan limbah non-B3.

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
const llm = (name, pos) =>
  http(
    name,
    {
      url: "={{ String($env.LLM_BASE_URL).replace(/\\/+$/, '') }}/chat/completions",
      headers: [{ name: 'Authorization', value: '=Bearer {{ $env.LLM_API_KEY }}' }],
      json: '={{ JSON.stringify($json.request) }}',
      timeout: 300000,
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
const dxUpload = (name, pos) =>
  node(name, 'n8n-nodes-base.httpRequest', 4.2, {
    method: 'POST',
    url: '={{ $env.DIRECTUS_URL }}/files',
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Authorization', value: '=Bearer {{ $env.DIRECTUS_WRITER_TOKEN }}' }] },
    sendBody: true,
    contentType: 'multipart-form-data',
    bodyParameters: { parameters: [
      { name: 'title', value: 'Cover AI' },
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
    const action = { img: 'imgmenu', iback: 'back', idef: 'pub_default', iai: 'pub_ai', ifoto: 'ask_photo', rev: 'ask_revision', del: 'cancel' }[cmd];
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
  // Foto sebagai balasan permintaan cover → jadikan cover artikel.
  if (m.photo && m.photo.length) {
    const ref2 = String(m.reply_to_message?.text || '').match(/([0-9a-f-]{36})/);
    if (ref2) return out({ action: 'photo_cover', chatId, draftId: ref2[1], fileId: m.photo[m.photo.length - 1].file_id });
    return out({ action: 'reply', chatId, text: 'Untuk memakai foto sebagai cover: pada draft tekan "🖼 Publish" → "📎 Lampirkan foto", lalu balas pesan itu dengan foto.' });
  }

  const text = String(m.text || '').trim();
  const help =
    '🌿 Bot Artikel ERI\n\n' +
    'Kirim ide atau poin-poin artikel dalam satu pesan teks. Contoh:\n' +
    '"Kapan usaha butuh UKL-UPL vs SPPL. Sasar pemilik pabrik kecil. Sebut Permen LHK 4/2021."\n\n' +
    'Bot menyusun draft (Indonesia + English), lalu mengirim pratinjau dengan tombol Publish / Revisi / Batal.\n\n' +
    `ID Telegram kamu: ${userId}`;
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
  const ctx = $('▶ Draft baru').first().json;
  return [{
    json: {
      request: {
        model: $env.LLM_MODEL,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: __SYSTEM_ID__ },
          { role: 'user', content: `Catatan dari tim ERI:\n\n${ctx.notes}\n\nMulai LANGSUNG dari <judul>.` },
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
tg('Telegram: sedang menyusun', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $json.chatId, text: '⏳ Menyusun artikel Indonesia lalu terjemahannya… biasanya 2–3 menit.' }) }}`,
  [720, 0], true);
code('Siapkan prompt ID', prepareId, [960, 0]);
llm('AI: tulis ID', [1200, 0]);
code('Olah ID', parseId, [1440, 0]);
filterNode('✓ ID valid', 'i.json.ok', [1680, 0]);
filterNode('✗ ID gagal', '!i.json.ok', [1680, 220]);
tg('Telegram: gagal draft', 'sendMessage', errorBody('▶ Draft baru'), [1920, 220]);
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
  { __CTX__: 'Tentukan slug unik', __ROUTE__: '▶ Draft baru', __LABEL__: 'Draft siap ditinjau' }, [3360, 0]);
tg('Telegram: kirim pratinjau', 'sendMessage', sendBody, [3600, 0]);
link('▶ Draft baru', 'Telegram: sedang menyusun', 'Siapkan prompt ID', 'AI: tulis ID', 'Olah ID');
link('Olah ID', '✓ ID valid', 'Siapkan prompt EN', 'AI: terjemah EN', 'Gabung draft',
  'Directus: cek slug', 'Tentukan slug unik', 'Directus: simpan draft', 'Susun pratinjau draft', 'Telegram: kirim pratinjau');
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
  return [{ json: { draftId: ctx.draftId, chatId: ctx.chatId, messageId: ctx.messageId, cover } }];
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
  const cover = (up && up.data && up.data.id) ? up.data.id : (DEFAULT_COVERS[d.category] || DEFAULT_COVERS['Lainnya']);
  return [{ json: { draftId: ctx.draftId, chatId: ctx.chatId, messageId: ctx.messageId, cover, aiOk: !!(up && up.data && up.data.id) } }];
}
function coverFoto() {
  const up = $input.first().json;
  const ctx = $('▶ Foto cover').first().json;
  const cover = (up && up.data && up.data.id) ? up.data.id : null;
  return [{ json: { draftId: ctx.draftId, chatId: ctx.chatId, messageId: null, cover } }];
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

// 6e. Lampirkan foto → minta user membalas dengan foto.
branch('▶ Minta foto', ['ask_photo'], [480, 1950]);
tg('Telegram: jawab minta foto', 'answerCallbackQuery', '={{ JSON.stringify({ callback_query_id: $json.callbackId }) }}', [720, 1950], true);
tg('Telegram: minta foto', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Minta foto').first().json.chatId, text: '📎 Balas pesan ini dengan foto untuk cover artikel.\\n\\n(draft: ' + $('▶ Minta foto').first().json.draftId + ')', reply_markup: { force_reply: true, input_field_placeholder: 'Kirim satu foto…' } }) }}`,
  [960, 1950]);
link('▶ Minta foto', 'Telegram: jawab minta foto', 'Telegram: minta foto');

// 6f. Foto diterima → import ke Directus → publish.
branch('▶ Foto cover', ['photo_cover'], [480, 2120]);
tg('Telegram: info memasang foto', 'sendMessage', `={{ JSON.stringify({ chat_id: $('▶ Foto cover').first().json.chatId, text: '🖼 Memasang foto & mempublish…' }) }}`, [720, 2120], true);
tg('Telegram: getFile', 'getFile', `={{ JSON.stringify({ file_id: $('▶ Foto cover').first().json.fileId }) }}`, [960, 2120], true);
dx('Directus: import foto', 'POST', '/files/import', {
  json: `={{ JSON.stringify({ url: 'https://api.telegram.org/file/bot' + $env.TELEGRAM_BOT_TOKEN + '/' + $('Telegram: getFile').first().json.result.file_path, title: 'Cover dari Telegram' }) }}`,
}, [1200, 2120], true);
code('Cover foto', coverFoto, [1440, 2120]);
link('▶ Foto cover', 'Telegram: info memasang foto', 'Telegram: getFile', 'Directus: import foto', 'Cover foto', 'Siapkan publish');

// 6g. Publish bersama (semua cabang gambar menuju sini).
code('Siapkan publish', assemblePublish, [2500, 1720]);
dx('Directus: publish (cover)', 'PATCH', `/items/articles/{{ $json.draftId }}`, {
  json: `={{ JSON.stringify({ status: 'published', published_at: new Date().toISOString(), cover: $json.cover }) }}`,
}, [2740, 1720], true);
tg('Telegram: hapus tombol pub', 'editMessageReplyMarkup',
  `={{ JSON.stringify({ chat_id: $('Siapkan publish').first().json.chatId, message_id: $('Siapkan publish').first().json.messageId, reply_markup: { inline_keyboard: [] } }) }}`,
  [2980, 1720], true);
tg('Telegram: info publish', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('Siapkan publish').first().json.chatId, text: $('Directus: publish (cover)').first().json.data?.slug ? '✅ Dipublish! Website diperbarui otomatis, tayang ±3 menit:\\n' + ${JSON.stringify(SITE)} + '/id/articles/' + $('Directus: publish (cover)').first().json.data.slug + '/' : '⚠️ Gagal mempublish (draft mungkin sudah dihapus).' }) }}`,
  [3220, 1720]);
link('Siapkan publish', 'Directus: publish (cover)', 'Telegram: hapus tombol pub', 'Telegram: info publish');

// ── 7. Tombol Batal ───────────────────────────────────────────────────────
branch('▶ Batal', ['cancel'], [480, 1350]);
tg('Telegram: jawab tombol batal', 'answerCallbackQuery',
  '={{ JSON.stringify({ callback_query_id: $json.callbackId, text: "Draft dibatalkan" }) }}', [720, 1350], true);
tg('Telegram: hapus tombol (batal)', 'editMessageReplyMarkup',
  `={{ JSON.stringify({ chat_id: $('▶ Batal').first().json.chatId, message_id: $('▶ Batal').first().json.messageId, reply_markup: { inline_keyboard: [] } }) }}`,
  [960, 1350], true);
tg('Telegram: info batal', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Batal').first().json.chatId, text: '🗑 Draft dibatalkan dan dihapus dari CMS.' }) }}`, [1200, 1350], true);
dx('Directus: hapus draft', 'DELETE', `/items/articles/{{ $('▶ Batal').first().json.draftId }}`, {}, [1440, 1350], true);
link('▶ Batal', 'Telegram: jawab tombol batal', 'Telegram: hapus tombol (batal)', 'Telegram: info batal', 'Directus: hapus draft');

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
