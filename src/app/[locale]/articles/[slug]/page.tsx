import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/Container';
import { CtaBand } from '@/components/CtaBand';
import { COMPANY, ROUTES, SITE_URL, type Locale } from '@/content/site';
import { getArticle, getArticleSlugs } from '@/lib/articles';

type Params = { locale: string; slug: string };

// Semua slug dirender statis saat build; slug tak dikenal → 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const a = getArticle(slug, l);
  if (!a) return {};
  const url = `${SITE_URL}/${l}${ROUTES.articles}/${slug}/`;
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/${l}${ROUTES.articles}/${slug}/` },
    openGraph: {
      type: 'article',
      title: `${a.title} · ${COMPANY}`,
      description: a.excerpt,
      url,
      siteName: COMPANY,
      locale: l === 'en' ? 'en_US' : 'id_ID',
      publishedTime: a.dateISO || undefined,
      images: a.cover ? [a.cover] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const a = getArticle(slug, l);
  if (!a) notFound();

  return (
    <>
      <article>
        <Container className="pt-16">
          <Link href={ROUTES.articles} className="text-sm font-bold">
            ← {l === 'en' ? 'All insights' : 'Semua artikel'}
          </Link>

          <div className="mt-8 flex flex-wrap gap-2.5 text-sm font-bold">
            <span className="text-brand">{a.category}</span>
            {a.date && (
              <>
                <span className="text-faint">·</span>
                <time dateTime={a.dateISO} className="text-faint">{a.date}</time>
              </>
            )}
          </div>
          <h1 className="m-0 mt-4 max-w-[860px] text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {a.title}
          </h1>
          {a.excerpt && (
            <p className="mt-5 max-w-[760px] text-lg leading-relaxed text-muted">{a.excerpt}</p>
          )}

          {a.cover && (
            <div className="mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-tint">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.cover} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          {/* Isi artikel: HTML dari editor CMS (konten tepercaya dari tim ERI). */}
          <div
            className="article-body mx-auto mt-12 max-w-[760px]"
            dangerouslySetInnerHTML={{ __html: a.body }}
          />
        </Container>
      </article>
      <CtaBand locale={l} />
    </>
  );
}
