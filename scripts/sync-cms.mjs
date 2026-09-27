// Dijalankan SEBELUM `next build` (GitHub Actions): menarik konten dari Directus.
//   articles   → src/content/articles.json
//   projects   → src/content/projects.json   (hanya bila CMS punya ≥1 proyek)
//   team       → src/content/team.json       (hanya bila CMS punya ≥1 anggota)
//   site_texts → src/content/overrides.json  (teks pengganti, kunci = jalur)
// Gambar diunduh sebagai WebP ke public/cms/. Tanpa DIRECTUS_URL/TOKEN, file
// JSON yang ter-commit dipakai apa adanya.
import { writeFileSync, mkdirSync } from 'node:fs';

const url = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const token = process.env.DIRECTUS_TOKEN;

if (!url || !token) {
  console.log('DIRECTUS_URL/DIRECTUS_TOKEN tidak diset — memakai data yang ter-commit.');
  process.exit(0);
}

const headers = { Authorization: `Bearer ${token}` };
const save = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
mkdirSync('public/cms', { recursive: true });

async function get(path, { optional = false } = {}) {
  const r = await fetch(`${url}${path}`, { headers });
  // 403/404 pada koleksi opsional = koleksi belum dibuat / belum diberi izin baca.
  if (optional && (r.status === 403 || r.status === 404)) return null;
  if (!r.ok) throw new Error(`Directus ${r.status} ${path}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).data;
}

async function asset(id, query, name) {
  if (!id) return null;
  const r = await fetch(`${url}/assets/${id}?${query}&format=webp&quality=80`, { headers });
  if (!r.ok) {
    console.warn(`  ! gambar ${id} gagal diunduh (${r.status})`);
    return null;
  }
  writeFileSync(`public/cms/${name}.webp`, Buffer.from(await r.arrayBuffer()));
  return `/cms/${name}.webp`;
}

const published = 'filter[status][_eq]=published&limit=-1';
const both = (id, en) => ({ id: id || '', en: en || id || '' });

// ── Artikel ───────────────────────────────────────────────────────────────
{
  const rows = await get(
    `/items/articles?${published}&sort=-published_at&fields=id,slug,category,published_at,title_id,title_en,excerpt_id,excerpt_en,body_id,body_en,cover`,
  );
  const articles = [];
  for (const a of rows) {
    articles.push({
      id: a.id,
      slug: a.slug,
      category: a.category || '',
      published_at: a.published_at,
      title: both(a.title_id, a.title_en),
      excerpt: both(a.excerpt_id, a.excerpt_en),
      body: both(a.body_id, a.body_en),
      cover: await asset(a.cover, 'width=1600', `${a.cover}-cover`),
    });
  }
  save('src/content/articles.json', articles);
  console.log(`✓ ${articles.length} artikel`);
}

// ── Portofolio ────────────────────────────────────────────────────────────
{
  const rows = await get(
    `/items/projects?${published}&sort=sort,title_id&fields=id,slug,category,client,client_short,year,tag_id,tag_en,title_id,title_en,location_id,location_en,photo,doc_front,doc_back`,
    { optional: true },
  );
  if (!rows) console.log('• koleksi projects belum ada — memakai data bawaan');
  else if (!rows.length) console.log('• projects kosong di CMS — memakai data bawaan');
  else {
    const projects = [];
    for (const p of rows) {
      const line = (location) => [p.client_short || p.client, location, p.year].filter(Boolean).join(' · ');
      const docs = [
        await asset(p.doc_front, 'height=760', `${p.doc_front}-doc`),
        await asset(p.doc_back, 'height=760', `${p.doc_back}-doc`),
      ].filter(Boolean);
      const img = await asset(p.photo, 'width=1200', `${p.photo}-photo`);
      projects.push({
        key: p.slug,
        cat: p.category || 'doc',
        client: p.client || '',
        tag: both(p.tag_id, p.tag_en),
        t: both(p.title_id, p.title_en),
        loc: { id: line(p.location_id), en: line(p.location_en || p.location_id) },
        ...(img ? { img } : {}),
        ...(docs.length ? { docs } : {}),
      });
    }
    save('src/content/projects.json', projects);
    console.log(`✓ ${projects.length} proyek`);
  }
}

// ── Tim ───────────────────────────────────────────────────────────────────
{
  const rows = await get(`/items/team?${published}&sort=sort,name&fields=id,name,photo`, { optional: true });
  if (!rows) console.log('• koleksi team belum ada — memakai data bawaan');
  else if (!rows.length) console.log('• team kosong di CMS — memakai data bawaan');
  else {
    const team = [];
    for (const m of rows) {
      team.push({ name: m.name, photo: await asset(m.photo, 'width=600&height=750&fit=cover', `${m.photo}-team`) });
    }
    save('src/content/team.json', team);
    console.log(`✓ ${team.length} anggota tim`);
  }
}

// ── Teks website ──────────────────────────────────────────────────────────
{
  const rows = await get('/items/site_texts?limit=-1&fields=key,value_id,value_en', { optional: true });
  if (!rows) console.log('• koleksi site_texts belum ada — memakai teks bawaan');
  else {
    const overrides = {};
    for (const r of rows) {
      if (r.value_id || r.value_en) overrides[r.key] = { id: r.value_id || '', en: r.value_en || '' };
    }
    save('src/content/overrides.json', overrides);
    console.log(`✓ ${Object.keys(overrides).length} teks`);
  }
}
