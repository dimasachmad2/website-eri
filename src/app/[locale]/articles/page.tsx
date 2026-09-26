import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { metaFor, ROUTES, type Locale } from '@/content/site';
import { getArticles } from '@/lib/articles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return metaFor(locale as Locale, 'articles');
}

export default async function ArticlesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const articles = getArticles(l);

  return (
    <>
      <PageHero locale={l} page="articles" />
      <Container className="pt-20">
        {articles.length === 0 ? (
          <p className="text-muted">{l === 'en' ? 'No articles yet.' : 'Belum ada artikel.'}</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`${ROUTES.articles}/${a.slug}`}
                className="group block text-ink hover:text-ink"
              >
                <div className="mb-[18px] h-[220px] overflow-hidden rounded-[10px] bg-tint">
                  {a.cover && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={a.cover}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="mb-2.5 flex gap-2.5 text-xs font-bold">
                  <span className="text-brand">{a.category}</span>
                  {a.date && (
                    <>
                      <span className="text-faint">·</span>
                      <span className="text-faint">{a.date}</span>
                    </>
                  )}
                </div>
                <h2 className="m-0 text-xl font-bold leading-snug tracking-tight transition-colors group-hover:text-brand">
                  {a.title}
                </h2>
                {a.excerpt && <p className="mt-2 text-sm leading-relaxed text-muted">{a.excerpt}</p>}
              </Link>
            ))}
          </div>
        )}
      </Container>
      <CtaBand locale={l} />
    </>
  );
}
