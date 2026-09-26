// Membuat koleksi `articles` di Directus (idempotent). Jalankan dari laptop:
//   DIRECTUS_URL=https://cms.enviroresources.co.id ADMIN_EMAIL=... ADMIN_PASSWORD=... node infra/directus/create-articles.mjs
// (PowerShell: $env:DIRECTUS_URL="..."; $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; node infra/directus/create-articles.mjs)

const url = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!url || !email || !password) {
  console.error('Set DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD dulu.');
  process.exit(1);
}

const login = await fetch(`${url}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) throw new Error(`Login gagal: ${login.status} ${await login.text()}`);
const token = (await login.json()).data.access_token;
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

const api = async (method, path, body) => {
  const r = await fetch(`${url}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

const exists = await fetch(`${url}/collections/articles`, { headers });
if (exists.ok) {
  console.log('Koleksi `articles` sudah ada — tidak diubah.');
  process.exit(0);
}

const categories = ['Regulasi', 'Persetujuan Teknis', 'Pelaporan', 'PROPER', 'Prasarana Limbah', 'Lainnya'];

await api('POST', '/collections', {
  collection: 'articles',
  meta: {
    icon: 'article',
    note: 'Artikel & wawasan (bilingual ID/EN)',
    display_template: '{{title_id}}',
    sort_field: 'published_at',
    archive_field: 'status',
    archive_value: 'archived',
    unarchive_value: 'draft',
  },
  schema: {},
  fields: [
    { field: 'id', type: 'uuid', meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] }, schema: { is_primary_key: true, length: 36, has_auto_increment: false } },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', display: 'labels', width: 'half', options: { choices: [
      { text: 'Draft', value: 'draft' }, { text: 'Published', value: 'published' }, { text: 'Archived', value: 'archived' } ] } }, schema: { default_value: 'draft' } },
    { field: 'published_at', type: 'timestamp', meta: { interface: 'datetime', width: 'half', note: 'Tanggal tayang (dipakai untuk urutan)' } },
    { field: 'slug', type: 'string', meta: { interface: 'input', required: true, note: 'huruf-kecil-dengan-tanda-hubung, unik' }, schema: { is_unique: true } },
    { field: 'category', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: categories.map((c) => ({ text: c, value: c })) } } },
    { field: 'cover', type: 'uuid', meta: { interface: 'file-image', special: ['file'], width: 'half', note: 'Gambar sampul (landscape)' } },
    { field: 'title_id', type: 'string', meta: { interface: 'input', required: true, note: 'Judul (Indonesia)' } },
    { field: 'title_en', type: 'string', meta: { interface: 'input', note: 'Judul (English)' } },
    { field: 'excerpt_id', type: 'text', meta: { interface: 'input-multiline', note: 'Ringkasan 1–2 kalimat (Indonesia)' } },
    { field: 'excerpt_en', type: 'text', meta: { interface: 'input-multiline', note: 'Summary (English)' } },
    { field: 'body_id', type: 'text', meta: { interface: 'input-rich-text-html', note: 'Isi artikel (Indonesia)' } },
    { field: 'body_en', type: 'text', meta: { interface: 'input-rich-text-html', note: 'Body (English)' } },
    { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true } },
    { field: 'date_updated', type: 'timestamp', meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true } },
  ],
});

await api('POST', '/relations', {
  collection: 'articles',
  field: 'cover',
  related_collection: 'directus_files',
  schema: { on_delete: 'SET NULL' },
});

console.log('✓ Koleksi `articles` dibuat (status, slug, kategori, cover, judul/ringkasan/isi ID+EN).');
