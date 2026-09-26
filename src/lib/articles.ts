// Artikel dari src/content/articles.json (diisi oleh scripts/sync-articles.mjs
// dari Directus saat build; fallback: contoh yang ter-commit).
import data from '@/content/articles.json';
import type { Locale } from '@/content/site';

type Bilingual = { id: string; en: string };

export type ArticleRaw = {
  id: string;
  slug: string;
  category: string;
  published_at: string | null;
  title: Bilingual;
  excerpt: Bilingual;
  body: Bilingual;
  cover: string | null;
};

export type Article = {
  slug: string;
  category: string;
  date: string; // sudah diformat sesuai locale
  dateISO: string;
  title: string;
  excerpt: string;
  body: string; // HTML dari CMS
  cover: string | null;
};

const CATEGORY_EN: Record<string, string> = {
  Regulasi: 'Regulation',
  'Persetujuan Teknis': 'Technical Approval',
  Pelaporan: 'Reporting',
  PROPER: 'PROPER',
  'Prasarana Limbah': 'Waste Infrastructure',
  Lainnya: 'Other',
};

const raw = data as ArticleRaw[];

function formatDate(iso: string | null, locale: Locale) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function localize(a: ArticleRaw, locale: Locale): Article {
  return {
    slug: a.slug,
    category: locale === 'en' ? CATEGORY_EN[a.category] ?? a.category : a.category,
    date: formatDate(a.published_at, locale),
    dateISO: a.published_at ?? '',
    title: a.title[locale] || a.title.id,
    excerpt: a.excerpt[locale] || a.excerpt.id,
    body: a.body[locale] || a.body.id,
    cover: a.cover,
  };
}

export function getArticles(locale: Locale): Article[] {
  return raw.map((a) => localize(a, locale));
}

export function getArticle(slug: string, locale: Locale): Article | undefined {
  const a = raw.find((x) => x.slug === slug);
  return a ? localize(a, locale) : undefined;
}

export function getArticleSlugs(): string[] {
  return raw.map((a) => a.slug);
}
