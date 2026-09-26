// Dijalankan SEBELUM `next build` (di GitHub Actions): tarik artikel published
// dari Directus → src/content/articles.json, dan unduh gambar sampul (webp)
// ke public/articles/. Tanpa DIRECTUS_URL/TOKEN, file articles.json yang ada dipakai.
import { writeFileSync, mkdirSync } from 'node:fs';

const url = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const token = process.env.DIRECTUS_TOKEN;
const OUT = 'src/content/articles.json';

if (!url || !token) {
  console.log('DIRECTUS_URL/DIRECTUS_TOKEN tidak diset — memakai articles.json yang ada.');
  process.exit(0);
}

const headers = { Authorization: `Bearer ${token}` };
const fields = [
  'id', 'slug', 'category', 'published_at',
  'title_id', 'title_en', 'excerpt_id', 'excerpt_en', 'body_id', 'body_en', 'cover',
].join(',');

const res = await fetch(
  `${url}/items/articles?filter[status][_eq]=published&sort=-published_at&limit=-1&fields=${fields}`,
  { headers },
);
if (!res.ok) throw new Error(`Directus ${res.status}: ${await res.text()}`);
const { data } = await res.json();

mkdirSync('public/articles', { recursive: true });
const articles = [];

for (const a of data) {
  let cover = null;
  if (a.cover) {
    const img = await fetch(`${url}/assets/${a.cover}?width=1600&format=webp&quality=80`, { headers });
    if (img.ok) {
      writeFileSync(`public/articles/${a.cover}.webp`, Buffer.from(await img.arrayBuffer()));
      cover = `/articles/${a.cover}.webp`;
    } else {
      console.warn(`  ! cover ${a.cover} gagal diunduh (${img.status})`);
    }
  }
  articles.push({
    id: a.id,
    slug: a.slug,
    category: a.category || '',
    published_at: a.published_at,
    title: { id: a.title_id || '', en: a.title_en || a.title_id || '' },
    excerpt: { id: a.excerpt_id || '', en: a.excerpt_en || a.excerpt_id || '' },
    body: { id: a.body_id || '', en: a.body_en || a.body_id || '' },
    cover,
  });
}

writeFileSync(OUT, JSON.stringify(articles, null, 2) + '\n');
console.log(`✓ ${articles.length} artikel disinkron dari Directus`);
