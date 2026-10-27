// Roadmap artikel untuk bot Telegram (idempotent, aman dijalankan ulang):
//   1) membuat koleksi `article_plans` (rencana artikel: judul, kata kunci, sudut, roadmap, prioritas, status)
//   2) izin CRUD untuk policy "Writer" (token bot n8n)
//   3) isi awal bila koleksi masih kosong: artikel yang sudah tayang (✅) + Roadmap 1 (⏳)
// Koleksi ini TIDAK memicu rebuild website (Flow hanya untuk konten situs).
//
// Jalankan dari laptop (PowerShell, folder website-eri):
//   $env:DIRECTUS_URL='https://cms.enviroresources.co.id'
//   $env:ADMIN_EMAIL='info@enviroresources.co.id'
//   $env:ADMIN_PASSWORD='...'
//   node infra/directus/create-article-plans.mjs
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

const C = 'article_plans';
const ROADMAP1 = 'Roadmap 1 · Perizinan dasar';
const STATUSES = [
  { text: 'Usulan AI (belum disimpan)', value: 'usulan', foreground: '#FFFFFF', background: '#A2B5CD' },
  { text: '⏳ Rencana', value: 'rencana', foreground: '#FFFFFF', background: '#6644FF' },
  { text: '📝 Draft', value: 'draft', foreground: '#FFFFFF', background: '#FFA439' },
  { text: '✅ Tayang', value: 'tayang', foreground: '#FFFFFF', background: '#2ECDA7' },
  { text: '⏭ Dilewati', value: 'dilewati', foreground: '#FFFFFF', background: '#A2B5CD' },
];

// ── 1. Koleksi ─────────────────────────────────────────────────────────────
if ((await fetch(`${url}/collections/${C}`, { headers: auth })).ok) {
  console.log(`• Koleksi ${C} sudah ada`);
} else {
  await api('POST', '/collections', {
    collection: C,
    meta: {
      icon: 'map',
      note: 'Roadmap artikel (dikelola bot Telegram). Seret untuk mengubah prioritas ⏳ rencana.',
      display_template: '#{{id}} {{title}}',
      sort_field: 'sort',
    },
    schema: {},
    fields: [
      // id angka (bukan UUID) supaya tombol Telegram pendek: rm:12
      { field: 'id', type: 'integer', meta: { hidden: true, readonly: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', display: 'labels', width: 'half', options: { choices: STATUSES }, display_options: { choices: STATUSES } }, schema: { default_value: 'rencana' } },
      { field: 'roadmap', type: 'string', meta: { interface: 'input', width: 'half', note: 'Nama roadmap, mis. "Roadmap 2 · Limbah B3 Gresik"' } },
      { field: 'title', type: 'string', meta: { interface: 'input', required: true, note: 'Judul rencana artikel' } },
      { field: 'keyword', type: 'string', meta: { interface: 'input', width: 'half', note: 'Kata kunci fokus (SEO)' } },
      { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', note: 'Prioritas: makin kecil makin dulu' } },
      { field: 'angle', type: 'text', meta: { interface: 'input-multiline', note: 'Sudut bahasan / catatan untuk AI penulis' } },
      { field: 'article', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], display: 'related-values', display_options: { template: '{{title_id}}' }, options: { template: '{{title_id}}' }, note: 'Artikel hasilnya (diisi otomatis oleh bot)' } },
      { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true } },
    ],
  });
  console.log(`✓ Koleksi ${C} dibuat`);
}

const rel = await fetch(`${url}/relations/${C}/article`, { headers: auth });
if (rel.ok) console.log('• Relasi ke articles sudah ada');
else {
  await api('POST', '/relations', { collection: C, field: 'article', related_collection: 'articles', schema: { on_delete: 'SET NULL' } });
  console.log('✓ Relasi article → articles dibuat');
}

// ── 2. Izin Writer ─────────────────────────────────────────────────────────
const policy = await first(`/policies?filter[name][_eq]=Writer&limit=1`);
if (!policy) {
  console.log('⚠ Policy Writer belum ada — jalankan infra/n8n/setup-writer.mjs dulu, lalu ulangi skrip ini.');
} else {
  for (const action of ['create', 'read', 'update', 'delete']) {
    const has = await first(`/permissions?filter[policy][_eq]=${policy.id}&filter[collection][_eq]=${C}&filter[action][_eq]=${action}&limit=1`);
    if (!has) {
      await api('POST', '/permissions', { policy: policy.id, collection: C, action, fields: ['*'], permissions: {} });
      console.log(`  ✓ Writer boleh ${action} ${C}`);
    }
  }
}

// ── 3. Isi awal ────────────────────────────────────────────────────────────
const any = await api('GET', `/items/${C}?limit=1&fields=id`);
if (any.length) {
  console.log('• Roadmap sudah berisi — isi awal dilewati');
} else {
  const published = await api('GET', '/items/articles?filter[status][_eq]=published&fields=id,title_id,slug&sort=published_at&limit=-1');
  // Artikel tayang yang termasuk tema Roadmap 1; sisanya dicatat "Di luar roadmap".
  const inRoadmap1 = ['kapan-pabrik-kecil-wajib-ukl-upl', 'memahami-persetujuan-teknis', 'memahami-dasar-hukum'];
  const done = published.map((a) => ({
    title: a.title_id,
    roadmap: inRoadmap1.some((p) => a.slug.startsWith(p)) ? ROADMAP1 : 'Di luar roadmap',
    status: 'tayang',
    article: a.id,
  }));
  const plan = [
    ['Beda AMDAL, UKL-UPL, dan SPPL: Mana yang Dibutuhkan Usaha Anda?', 'perbedaan amdal ukl upl sppl',
      'Perbandingan ketiga dokumen secara sederhana (kapan wajib, tingkat dampak, contoh jenis usaha), lalu arahkan pembaca mengecek kewajiban lewat KBLI/OSS dan konsultasi.'],
    ['Syarat dan Proses Penyusunan UKL-UPL untuk Pabrik Skala Kecil-Menengah', 'syarat ukl upl',
      'Data dan dokumen yang perlu disiapkan, tahapan penyusunan sampai persetujuan, serta kesalahan umum yang membuat proses lama. Untuk pemilik pabrik kecil-menengah.'],
    ['Alur Lengkap Persetujuan Teknis dan SLO untuk IPAL', 'persetujuan teknis dan slo ipal',
      'Urutan dari kajian teknis → Persetujuan Teknis → pembangunan IPAL → uji → Surat Kelayakan Operasional (SLO); jelaskan beda Pertek dan SLO.'],
    ['Rincian Teknis Limbah B3: Apa Itu dan Bagaimana Mengurusnya?', 'rincian teknis limbah b3',
      'Siapa yang wajib, isi dokumen (penyimpanan/TPS limbah B3), kaitannya dengan persetujuan lingkungan. ERI membantu menyusun dokumen, bukan mengangkut limbah.'],
    ['Tips Memilih Konsultan Lingkungan di Sidoarjo dan Surabaya', 'konsultan lingkungan sidoarjo',
      'Kriteria memilih konsultan (pengalaman, tenaga ahli bersertifikat, rekam jejak, transparansi proses) dan pertanyaan yang perlu diajukan. ERI berbasis di Sidoarjo.'],
    ['Persiapan Menghadapi Penilaian PROPER: Panduan untuk Perusahaan', 'persiapan proper',
      'Gambaran umum aspek yang dinilai, data dan dokumen yang perlu dirapikan, serta langkah persiapan bertahap sebelum penilaian.'],
  ].map(([title, keyword, angle], i) => ({ title, keyword, angle, roadmap: ROADMAP1, status: 'rencana', sort: (i + 1) * 10 }));

  const items = [...done, ...plan];
  await api('POST', `/items/${C}`, items);
  console.log(`✓ Isi awal: ${done.length} artikel tayang + ${plan.length} rencana (${ROADMAP1})`);
}
console.log('Selesai.');
