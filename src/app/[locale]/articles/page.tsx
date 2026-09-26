import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { getSite, metaFor, type Locale } from '@/content/site';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return metaFor(locale as Locale, 'articles');
}

export default async function ArticlesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t } = getSite(locale as Locale);

  return (
    <>
      <PageHero locale={locale as Locale} page="articles" />
      <Container className="pt-20">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {t.articles.map((a: { cat: string; status: string; t: string; img: string }, i: number) => (
            <article key={i} className="group">
              <div className="mb-[18px] h-[220px] overflow-hidden rounded-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.img}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
                />
              </div>
              <div className="mb-2.5 flex gap-2.5 text-xs font-bold">
                <span className="text-brand">{a.cat}</span>
                <span className="text-faint">·</span>
                <span className="text-faint">{a.status}</span>
              </div>
              <h2 className="m-0 text-xl font-bold leading-snug tracking-tight">{a.t}</h2>
            </article>
          ))}
        </div>
      </Container>
      <CtaBand locale={locale as Locale} />
    </>
  );
}
