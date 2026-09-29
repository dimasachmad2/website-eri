// Menghasilkan workflow n8n "ERI — Artikel via Telegram" (file JSON siap impor).
//
//   node infra/n8n/build-workflow.mjs [ID_TELEGRAM,ID_TELEGRAM2]
//
// Output: infra/n8n/out/eri-telegram-articles.json (di-gitignore karena berisi
// alamat webhook acak — alamat itu yang menjadi "kunci" webhook).
//
// Alur: Telegram → n8n → AI via endpoint OpenAI-compatible (draft ID+EN) → Directus (draft) → pratinjau
// Telegram dengan tombol Publish / Revisi / Batal → Directus (published) → rebuild.
// Kunci API dibaca dari env container n8n lewat ekspresi {{ $env.X }}.
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
const FIELDS = ['title_id', 'title_en', 'excerpt_id', 'excerpt_en', 'body_id', 'body_en', 'slug', 'category'];
const CATEGORIES = ['Regulasi', 'Persetujuan Teknis', 'Pelaporan', 'PROPER', 'Prasarana Limbah', 'Lainnya'];

const SYSTEM = `Kamu adalah penulis konten untuk PT Enviro Resources Indonesia (ERI), konsultan lingkungan di Sidoarjo, Jawa Timur. Layanan ERI: AMDAL, UKL-UPL, SPPL, DELH/DPLH, Persetujuan Teknis air limbah dan emisi, SLO, Rincian Teknis Limbah B3, Andalalin, SIPA, pelaporan RKL-RPL/UKL-UPL, audit lingkungan, pendampingan PROPER, prasarana pengolahan limbah (IPAL), dan pengelolaan limbah non-B3.

Tugasmu: mengubah catatan atau ide dari tim ERI menjadi artikel wawasan untuk website, dalam Bahasa Indonesia beserta terjemahan Bahasa Inggris yang setara.

Pembaca: pemilik usaha, manajer HSE/operasional, dan instansi yang perlu memahami kewajiban lingkungan. Tulis dengan jelas, praktis, dan akurat; jelaskan istilah teknis saat pertama kali muncul.

Akurasi regulasi sangat penting karena artikel ini mewakili kredibilitas konsultan. Sebutkan nomor peraturan hanya jika kamu yakin peraturan itu ada dan relevan, atau jika disebutkan dalam catatan. Jangan mengarang nomor pasal, angka baku mutu, biaya, atau tenggat waktu. Bila ragu, jelaskan secara umum dan sarankan pembaca mengonsultasikan kasus spesifiknya.

Isi artikel (body_id dan body_en): HTML sederhana, sekitar 600–1000 kata per bahasa. Tag yang boleh dipakai: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. Jangan memakai <h1> (judul sudah terpisah), gambar, style, atau atribut. Akhiri dengan satu paragraf singkat yang mengajak pembaca berkonsultasi dengan ERI.

Ringkasan (excerpt_id dan excerpt_en): 1–2 kalimat, maksimal 200 karakter.
Slug: dari judul Bahasa Indonesia, huruf kecil, kata dipisah tanda hubung, tanpa tanda baca, maksimal 70 karakter.
Kategori: pilih satu yang paling sesuai dari: ${CATEGORIES.join(', ')}.

Format jawaban: HANYA satu objek JSON yang valid, tanpa kalimat pembuka, tanpa penutup, tanpa pagar kode. Objek itu punya tepat delapan kunci bertipe string: ${FIELDS.join(', ')}.`;

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
  __SYSTEM__: JSON.stringify(SYSTEM),
  __FIELDS__: JSON.stringify(FIELDS),
  __CATEGORIES__: JSON.stringify(CATEGORIES),
  __CMS__: JSON.stringify(CMS_PUBLIC),
  __SITE__: JSON.stringify(SITE),
  __ALLOWED__: JSON.stringify(allowed),
};
const code = (name, fn, pos) => node(name, 'n8n-nodes-base.code', 2, { jsCode: fill(body(fn), VARS) }, pos);
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
// Endpoint OpenAI-compatible (chat completions). LLM_BASE_URL sudah termasuk
// versinya, mis. https://penyedia.example/v1
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
    const action = { pub: 'publish', rev: 'ask_revision', del: 'cancel' }[cmd];
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
branch('▶ Balasan', ['reply'], [480, 1400]);
tg('Telegram: balas', 'sendMessage', '={{ JSON.stringify({ chat_id: $json.chatId, text: $json.text }) }}', [720, 1400]);
link('▶ Balasan', 'Telegram: balas');

// Bagian bersama: menyiapkan request AI & mengolah hasilnya.
function prepareDraft() {
  const x = $input.first().json;
  const ctx = $('▶ Draft baru').first().json;
  return [{
    json: {
      request: {
        model: $env.LLM_MODEL,
        max_tokens: 16000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: __SYSTEM__ },
          { role: 'user', content: `Catatan dari tim ERI:\n\n${ctx.notes}` },
        ],
      },
    },
  }];
}
function prepareRevision() {
  const cur = $input.first().json.data || {};
  const ctx = $('▶ Revisi').first().json;
  const current = {
    title_id: cur.title_id, title_en: cur.title_en, excerpt_id: cur.excerpt_id, excerpt_en: cur.excerpt_en,
    body_id: cur.body_id, body_en: cur.body_en, slug: cur.slug, category: cur.category,
  };
  return [{
    json: {
      request: {
        model: $env.LLM_MODEL,
        max_tokens: 16000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: __SYSTEM__ },
          {
            role: 'user',
            content:
              `Draft artikel saat ini (JSON):\n${JSON.stringify(current)}\n\n` +
              `Catatan revisi dari tim ERI:\n${ctx.feedback}\n\n` +
              'Revisi artikel sesuai catatan dan kembalikan artikel LENGKAP dalam format yang sama. ' +
              'Pertahankan slug kecuali catatan meminta perubahan.',
          },
        ],
      },
    },
  }];
}
function parseLlm() {
  const r = $input.first().json;
  const fail = (error) => [{ json: { ok: false, error } }];
  if (r.error) {
    const msg = r.error.message || r.error.description || JSON.stringify(r.error);
    return fail('Gagal memanggil AI: ' + String(msg).slice(0, 300));
  }
  const choice = (r.choices || [])[0];
  if (!choice) return fail('Jawaban AI kosong. Cek LLM_BASE_URL, LLM_API_KEY, dan LLM_MODEL di server.');
  if (choice.finish_reason === 'content_filter') return fail('AI menolak menyusun artikel ini. Coba ubah catatannya.');
  // Ambil isi jawaban. Bisa berupa string, daftar bagian, atau (model penalar)
  // di field reasoning_content / choice.text. JSON bisa terbungkus ```json.
  const m = choice.message || {};
  const c = m.content;
  let text = Array.isArray(c) ? c.map((p) => (typeof p === 'string' ? p : p.text || '')).join('') : String(c || '');
  if (!text.trim() && m.reasoning_content) text = String(m.reasoning_content);
  if (!text.trim() && typeof choice.text === 'string') text = choice.text;
  text = text.replace(/```json/gi, '').replace(/```/g, '');
  const from = text.indexOf('{');
  const to = text.lastIndexOf('}');
  let a;
  try {
    a = JSON.parse(text.slice(from, to + 1));
  } catch (e) {
    if (choice.finish_reason === 'length') return fail('Artikel terlalu panjang sehingga terpotong. Coba persempit topiknya.');
    const snip = text.trim().slice(0, 200).replace(/\s+/g, ' ');
    return fail('Format hasil dari AI tidak valid. Cuplikan jawaban: ' + (snip || '(kosong)'));
  }
  const FIELDS = __FIELDS__;
  const missing = FIELDS.filter((k) => typeof a[k] !== 'string' || !a[k].trim());
  if (missing.length) return fail('Hasil AI tidak lengkap (' + missing.join(', ') + '). Coba kirim ulang.');
  a = Object.fromEntries(FIELDS.map((k) => [k, a[k]]));
  if (!__CATEGORIES__.includes(a.category)) a.category = 'Lainnya';
  a.slug = String(a.slug || a.title_id || 'artikel')
    .toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 70).replace(/-+$/, '');
  return [{ json: { ok: true, article: a } }];
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
  const text =
    `📝 <b>${'__LABEL__'}</b>\n\n` +
    `<b>${esc(a.title_id)}</b>\n<i>${esc(a.title_en)}</i>\n\n` +
    `🏷 ${esc(a.category)} · ±${words} kata\n\n` +
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
            { text: '✅ Publish', callback_data: `pub:${id}` },
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

// ── 3. Draft baru ─────────────────────────────────────────────────────────
branch('▶ Draft baru', ['draft'], [480, 0]);
tg('Telegram: sedang menyusun', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $json.chatId, text: '⏳ Menyusun draft artikel (Indonesia + English)… biasanya 1–2 menit.' }) }}`,
  [720, 0], true);
code('Siapkan prompt draft', prepareDraft, [960, 0]);
llm('AI: tulis draft', [1200, 0]);
code('Olah hasil draft', parseLlm, [1440, 0]);
filterNode('✓ Draft valid', 'i.json.ok', [1680, 0]);
filterNode('✗ Draft gagal', '!i.json.ok', [1680, 200]);
tg('Telegram: gagal draft', 'sendMessage', errorBody('▶ Draft baru'), [1920, 200]);
dx('Directus: cek slug', 'GET', '/items/articles', {
  query: [
    { name: 'filter[slug][_starts_with]', value: '={{ $json.article.slug }}' },
    { name: 'fields', value: 'slug' },
    { name: 'limit', value: '-1' },
  ],
}, [1920, 0], true);
code('Tentukan slug unik', function () {
  const base = $('✓ Draft valid').first().json.article;
  const taken = new Set(($input.first().json.data || []).map((x) => x.slug));
  let slug = base.slug;
  for (let n = 2; taken.has(slug); n++) slug = `${base.slug}-${n}`;
  return [{ json: { article: { ...base, slug, status: 'draft' } } }];
}, [2160, 0]);
dx('Directus: simpan draft', 'POST', '/items/articles', {
  json: '={{ JSON.stringify($json.article) }}',
}, [2400, 0], true);
node('Susun pratinjau draft', 'n8n-nodes-base.code', 2, {
  jsCode: fill(body(previewMessage), { ...VARS, __CTX__: 'Tentukan slug unik', __ROUTE__: '▶ Draft baru', __LABEL__: 'Draft siap ditinjau' }),
}, [2640, 0]);
tg('Telegram: kirim pratinjau', 'sendMessage', sendBody, [2880, 0]);
link('▶ Draft baru', 'Telegram: sedang menyusun', 'Siapkan prompt draft', 'AI: tulis draft', 'Olah hasil draft');
link('Olah hasil draft', '✓ Draft valid', 'Directus: cek slug', 'Tentukan slug unik', 'Directus: simpan draft',
  'Susun pratinjau draft', 'Telegram: kirim pratinjau');
link('Olah hasil draft', '✗ Draft gagal', 'Telegram: gagal draft');

// ── 4. Revisi (balasan berisi catatan) ────────────────────────────────────
branch('▶ Revisi', ['revise'], [480, 450]);
tg('Telegram: sedang merevisi', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $json.chatId, text: '⏳ Merevisi draft… biasanya 1–2 menit.' }) }}`, [720, 450], true);
dx('Directus: ambil draft', 'GET', `/items/articles/{{ $('▶ Revisi').first().json.draftId }}`, {}, [960, 450], true);
code('Siapkan prompt revisi', prepareRevision, [1200, 450]);
llm('AI: revisi', [1440, 450]);
code('Olah hasil revisi', function () {
  // Slug dipertahankan agar tautan tidak berubah.
  const parsed = __PARSE__;
  if (!parsed[0].json.ok) return parsed;
  const cur = $('Directus: ambil draft').first().json.data || {};
  parsed[0].json.article.slug = cur.slug || parsed[0].json.article.slug;
  return parsed;
}, [1680, 450]);
filterNode('✓ Revisi valid', 'i.json.ok', [1920, 450]);
filterNode('✗ Revisi gagal', '!i.json.ok', [1920, 650]);
tg('Telegram: gagal revisi', 'sendMessage', errorBody('▶ Revisi'), [2160, 650]);
dx('Directus: perbarui draft', 'PATCH', `/items/articles/{{ $('▶ Revisi').first().json.draftId }}`, {
  json: '={{ JSON.stringify($json.article) }}',
}, [2160, 450], true);
node('Susun pratinjau revisi', 'n8n-nodes-base.code', 2, {
  jsCode: fill(body(previewMessage), { ...VARS, __CTX__: '✓ Revisi valid', __ROUTE__: '▶ Revisi', __LABEL__: 'Draft sudah direvisi' }),
}, [2400, 450]);
tg('Telegram: kirim pratinjau revisi', 'sendMessage', sendBody, [2640, 450]);
link('▶ Revisi', 'Telegram: sedang merevisi', 'Directus: ambil draft', 'Siapkan prompt revisi', 'AI: revisi', 'Olah hasil revisi');
link('Olah hasil revisi', '✓ Revisi valid', 'Directus: perbarui draft', 'Susun pratinjau revisi', 'Telegram: kirim pratinjau revisi');
link('Olah hasil revisi', '✗ Revisi gagal', 'Telegram: gagal revisi');

// ── 5. Tombol Revisi → minta catatan ─────────────────────────────────────
branch('▶ Minta revisi', ['ask_revision'], [480, 850]);
tg('Telegram: jawab tombol revisi', 'answerCallbackQuery',
  '={{ JSON.stringify({ callback_query_id: $json.callbackId }) }}', [720, 850], true);
tg('Telegram: minta catatan', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Minta revisi').first().json.chatId, text: '✏️ Balas pesan ini dengan catatan revisi.\\n\\nID draft: ' + $('▶ Minta revisi').first().json.draftId, reply_markup: { force_reply: true, input_field_placeholder: 'Catatan revisi…' } }) }}`,
  [960, 850]);
link('▶ Minta revisi', 'Telegram: jawab tombol revisi', 'Telegram: minta catatan');

// ── 6. Tombol Publish ─────────────────────────────────────────────────────
branch('▶ Publish', ['publish'], [480, 1050]);
tg('Telegram: jawab tombol publish', 'answerCallbackQuery',
  `={{ JSON.stringify({ callback_query_id: $json.callbackId, text: 'Mempublish…' }) }}`, [720, 1050], true);
dx('Directus: publish', 'PATCH', `/items/articles/{{ $('▶ Publish').first().json.draftId }}`, {
  json: `={{ JSON.stringify({ status: 'published', published_at: new Date().toISOString() }) }}`,
}, [960, 1050], true);
tg('Telegram: hapus tombol (publish)', 'editMessageReplyMarkup',
  `={{ JSON.stringify({ chat_id: $('▶ Publish').first().json.chatId, message_id: $('▶ Publish').first().json.messageId, reply_markup: { inline_keyboard: [] } }) }}`,
  [1200, 1050], true);
tg('Telegram: info publish', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Publish').first().json.chatId, text: $('Directus: publish').first().json.data?.slug ? '✅ Dipublish! Website diperbarui otomatis, tayang ±3 menit:\\n' + ${JSON.stringify(SITE)} + '/id/articles/' + $('Directus: publish').first().json.data.slug + '/' : '⚠️ Gagal mempublish (draft mungkin sudah dihapus).' }) }}`,
  [1440, 1050]);
link('▶ Publish', 'Telegram: jawab tombol publish', 'Directus: publish', 'Telegram: hapus tombol (publish)', 'Telegram: info publish');

// ── 7. Tombol Batal ───────────────────────────────────────────────────────
branch('▶ Batal', ['cancel'], [480, 1250]);
tg('Telegram: jawab tombol batal', 'answerCallbackQuery',
  '={{ JSON.stringify({ callback_query_id: $json.callbackId, text: "Draft dibatalkan" }) }}', [720, 1250], true);
tg('Telegram: hapus tombol (batal)', 'editMessageReplyMarkup',
  `={{ JSON.stringify({ chat_id: $('▶ Batal').first().json.chatId, message_id: $('▶ Batal').first().json.messageId, reply_markup: { inline_keyboard: [] } }) }}`,
  [960, 1250], true);
tg('Telegram: info batal', 'sendMessage',
  `={{ JSON.stringify({ chat_id: $('▶ Batal').first().json.chatId, text: '🗑 Draft dibatalkan dan dihapus dari CMS.' }) }}`, [1200, 1250], true);
dx('Directus: hapus draft', 'DELETE', `/items/articles/{{ $('▶ Batal').first().json.draftId }}`, {}, [1440, 1250], true);
link('▶ Batal', 'Telegram: jawab tombol batal', 'Telegram: hapus tombol (batal)', 'Telegram: info batal', 'Directus: hapus draft');

// "Olah hasil revisi" memakai ulang parser draft.
const rev = nodes.find((n) => n.name === 'Olah hasil revisi');
rev.parameters.jsCode = rev.parameters.jsCode.replace(
  'const parsed = __PARSE__;',
  `const parsed = (() => {\n${fill(body(parseLlm), VARS)}})();`,
);

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
