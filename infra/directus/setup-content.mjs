// Memindahkan portofolio, tim, dan teks website ke Directus (idempotent):
//   1) membuat koleksi `projects`, `team`, `site_texts`
//   2) izin: Reader (baca) & Writer (kelola) — Writer ada bila setup-writer sudah dijalankan
//   3) mengisi data awal dari repo (hanya bila koleksi masih kosong), termasuk upload gambar
//   4) menambahkan koleksi baru ke Flow "Rebuild website"
//
// Jalankan dari laptop (PowerShell, folder website-eri):
//   $env:DIRECTUS_URL='https://cms.enviroresources.co.id'
//   $env:ADMIN_EMAIL='info@enviroresources.co.id'
//   $env:ADMIN_PASSWORD='...'
//   node infra/directus/setup-content.mjs
import { readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDefaultTexts } from './default-texts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const url = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
if (!url || !email || !password) {
  console.error('Set DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD dulu.');
  process.exit(1);
}

const login = await fetch(`${url}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) throw new Error(`Login admin gagal (${login.status}). Cek email/password.`);
const auth = { Authorization: `Bearer ${(await login.json()).data.access_token}` };

async function api(method, path, body) {
  const r = await fetch(`${url}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...auth },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : (await r.json()).data;
}
const first = async (path) => (await api('GET', path))[0];
const exists = async (collection) => (await fetch(`${url}/collections/${collection}`, { headers: auth })).ok;
const isEmpty = async (collection) => (await api('GET', `/items/${collection}?limit=1&fields=*`)).length === 0;

// ── Definisi field ────────────────────────────────────────────────────────
const uuidPk = { field: 'id', type: 'uuid', meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] }, schema: { is_primary_key: true, length: 36, has_auto_increment: false } };
const status = { field: 'status', type: 'string', meta: { interface: 'select-dropdown', display: 'labels', width: 'half', options: { choices: [
  { text: 'Draft', value: 'draft' }, { text: 'Published', value: 'published' }, { text: 'Archived', value: 'archived' } ] } }, schema: { default_value: 'draft' } };
const sort = { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } };
const text = (field, note, extra = {}) => ({ field, type: 'string', meta: { interface: 'input', note, ...extra } });
const image = (field, note) => ({ field, type: 'uuid', meta: { interface: 'file-image', special: ['file'], width: 'half', note } });
const archive = { archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' };

const COLLECTIONS = {
  projects: {
    meta: { icon: 'work', note: 'Portofolio proyek (bilingual). Seret untuk mengubah urutan.', display_template: '{{title_id}} — {{client}}', sort_field: 'sort', ...archive },
    fields: [
      uuidPk, status, sort,
      { field: 'category', type: 'string', meta: { interface: 'select-dropdown', width: 'half', note: 'Menentukan filter di halaman Portofolio', options: { choices: [
        { text: 'Dokumen Lingkungan', value: 'doc' }, { text: 'Persetujuan Teknis', value: 'tech' },
        { text: 'Prasarana Limbah', value: 'infra' }, { text: 'Limbah Non-B3', value: 'waste' } ] } }, schema: { default_value: 'doc' } },
      { ...text('slug', 'huruf-kecil-dengan-tanda-hubung, unik', { required: true }), schema: { is_unique: true } },
      text('client', 'Nama klien, mis. PT HM Sampoerna Tbk', { width: 'half' }),
      text('client_short', 'Nama singkat klien untuk baris keterangan (kosong = sama dengan nama klien)', { width: 'half' }),
      { field: 'year', type: 'integer', meta: { interface: 'input', width: 'half', note: 'Tahun selesai (boleh kosong)' } },
      text('tag_id', 'Label singkat, mis. Pertek BMAL', { width: 'half' }),
      text('tag_en', 'Short label (English)', { width: 'half' }),
      text('title_id', 'Judul proyek (Indonesia)', { required: true }),
      text('title_en', 'Project title (English)'),
      text('location_id', 'Lokasi, mis. Plant Tegal, Jawa Tengah', { width: 'half' }),
      text('location_en', 'Location (English)', { width: 'half' }),
      image('photo', 'Foto lapangan (opsional). Bila diisi, foto ini yang tampil.'),
      image('doc_front', 'Dokumen depan (sampul) — tampil sebagai mockup'),
      image('doc_back', 'Dokumen belakang (opsional)'),
    ],
    files: ['photo', 'doc_front', 'doc_back'],
  },
  team: {
    meta: { icon: 'groups', note: 'Tim ahli. Seret untuk mengubah urutan.', display_template: '{{name}}', sort_field: 'sort', ...archive },
    fields: [
      uuidPk, status, sort,
      text('name', 'Nama lengkap + gelar, mis. Dian Retno Hapsari, S.T', { required: true }),
      image('photo', 'Foto potret (opsional). Tanpa foto, tampil avatar inisial.'),
    ],
    files: ['photo'],
  },
  site_texts: {
    meta: { icon: 'text_fields', note: 'Semua teks website. Cari teksnya, ubah, simpan. Kolom kosong = pakai teks bawaan.', display_template: '{{key}} — {{value_id}}' },
    fields: [
      { field: 'key', type: 'string', meta: { interface: 'input', readonly: true, note: 'Penanda posisi teks di website (jangan diubah)' }, schema: { is_primary_key: true, length: 255, has_auto_increment: false } },
      { field: 'group', type: 'string', meta: { interface: 'input', readonly: true, width: 'half', note: 'Bagian website' } },
      { field: 'value_id', type: 'text', meta: { interface: 'input-multiline', note: 'Teks Bahasa Indonesia' } },
      { field: 'value_en', type: 'text', meta: { interface: 'input-multiline', note: 'English text' } },
    ],
    files: [],
  },
};

// ── 1. Koleksi ────────────────────────────────────────────────────────────
for (const [name, def] of Object.entries(COLLECTIONS)) {
  if (await exists(name)) {
    console.log(`• Koleksi ${name} sudah ada`);
    continue;
  }
  await api('POST', '/collections', { collection: name, meta: def.meta, schema: {}, fields: def.fields });
  for (const field of def.files) {
    await api('POST', '/relations', { collection: name, field, related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } });
  }
  console.log(`✓ Koleksi ${name} dibuat`);
}

// ── 2. Izin ───────────────────────────────────────────────────────────────
async function grant(policyName, collection, actions) {
  const policy = await first(`/policies?filter[name][_eq]=${policyName}&limit=1`);
  if (!policy) return false;
  for (const action of actions) {
    const has = await first(
      `/permissions?filter[policy][_eq]=${policy.id}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&limit=1`,
    );
    if (!has) await api('POST', '/permissions', { policy: policy.id, collection, action, fields: ['*'], permissions: {} });
  }
  return true;
}
const names = Object.keys(COLLECTIONS);
for (const c of names) await grant('Reader', c, ['read']);
console.log('✓ Reader boleh membaca koleksi baru');
let writer = true;
for (const c of names) writer = (await grant('Writer', c, ['create', 'read', 'update', 'delete'])) && writer;
if (writer) {
  await grant('Writer', 'directus_files', ['create', 'read', 'update']);
  console.log('✓ Writer (bot) boleh mengelola koleksi baru & mengunggah gambar');
} else console.log('• Policy Writer belum ada — jalankan infra/n8n/setup-writer.mjs dulu, lalu script ini lagi');

// ── 3. Data awal ──────────────────────────────────────────────────────────
const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
async function upload(publicPath, title) {
  const file = join(ROOT, 'public', publicPath);
  const form = new FormData();
  form.append('title', title);
  form.append('file', new Blob([readFileSync(file)], { type: MIME[extname(file).toLowerCase()] || 'application/octet-stream' }), basename(file));
  const r = await fetch(`${url}/files`, { method: 'POST', headers: auth, body: form });
  if (!r.ok) throw new Error(`Upload ${publicPath} → ${r.status} ${await r.text()}`);
  return (await r.json()).data.id;
}
const readJson = (name) => JSON.parse(readFileSync(join(ROOT, 'src/content', name), 'utf8'));

if (await isEmpty('projects')) {
  const projects = readJson('projects.json');
  let n = 0;
  for (const p of projects) {
    // "Klien · Lokasi · Tahun" → kolom terpisah
    const [short, locId, yearId] = p.loc.id.split(' · ');
    const [, locEn] = p.loc.en.split(' · ');
    const docs = [];
    for (const d of p.docs || []) docs.push(await upload(d, `${p.client} — ${p.tag.id}`));
    await api('POST', '/items/projects', {
      status: 'published', sort: ++n, slug: p.key, category: p.cat,
      client: p.client || short, client_short: short && short !== p.client ? short : null, year: /^\d{4}$/.test(yearId || '') ? Number(yearId) : null,
      tag_id: p.tag.id, tag_en: p.tag.en, title_id: p.t.id, title_en: p.t.en,
      location_id: locId || '', location_en: locEn || locId || '',
      photo: p.img ? await upload(p.img, `${p.client} — foto`) : null,
      doc_front: docs[0] || null, doc_back: docs[1] || null,
    });
    process.stdout.write(`\r  mengunggah proyek ${n}/${projects.length}`);
  }
  console.log(`\n✓ ${n} proyek diisi`);
} else console.log('• projects sudah berisi — tidak diubah');

if (await isEmpty('team')) {
  const team = readJson('team.json');
  await api('POST', '/items/team', team.map((m, i) => ({ status: 'published', sort: i + 1, name: m.name })));
  console.log(`✓ ${team.length} anggota tim diisi`);
} else console.log('• team sudah berisi — tidak diubah');

if (await isEmpty('site_texts')) {
  const texts = loadDefaultTexts(ROOT);
  const rows = Object.entries(texts).map(([key, v]) => ({ key, group: key.split('.')[0], value_id: v.id, value_en: v.en }));
  for (let i = 0; i < rows.length; i += 100) await api('POST', '/items/site_texts', rows.slice(i, i + 100));
  console.log(`✓ ${rows.length} teks diisi`);
} else console.log('• site_texts sudah berisi — tidak diubah');

// ── 4. Flow rebuild ───────────────────────────────────────────────────────
// Dilakukan paling akhir supaya pengisian data awal tidak memicu ratusan rebuild.
const flow = await first(`/flows?filter[name][_eq]=${encodeURIComponent('Rebuild website')}&fields=id,options&limit=1`);
if (flow) {
  const collections = [...new Set([...(flow.options?.collections || []), ...names])];
  await api('PATCH', `/flows/${flow.id}`, { options: { ...flow.options, collections } });
  console.log(`✓ Flow "Rebuild website" memantau: ${collections.join(', ')}`);
} else console.log('! Flow "Rebuild website" tidak ditemukan — jalankan setup-access.mjs dengan GITHUB_DISPATCH_TOKEN');

console.log('\nSelesai. Perubahan di CMS akan tayang setelah rebuild berikutnya.');
