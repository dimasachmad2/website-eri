import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { getSite, type Locale } from '@/content/site';

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t } = getSite(locale as Locale);
  const legal = t.legal;

  return (
    <>
      <PageHero locale={locale as Locale} page="legal" />

      {/* KBLI */}
      <Container className="pt-20">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">KBLI</div>
        <h2 className="m-0 mb-9 text-3xl font-extrabold tracking-tight md:text-4xl">{legal.kbliT}</h2>
        <div className="overflow-hidden rounded-xl border border-line">
          {legal.kbli.map((k: { c: string; t: string; d: string }) => (
            <div
              key={k.c}
              className="grid grid-cols-1 gap-2 border-b border-line px-7 py-6 last:border-b-0 md:grid-cols-[120px_1fr_1.4fr] md:gap-8"
            >
              <span className="text-2xl font-extrabold text-brand">{k.c}</span>
              <span className="text-base font-bold leading-snug">{k.t}</span>
              <span className="text-sm leading-relaxed text-muted">{k.d}</span>
            </div>
          ))}
        </div>
      </Container>

      {/* Dokumen legal */}
      <Container className="pt-24">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">{legal.docL}</div>
        <h2 className="m-0 mb-9 text-3xl font-extrabold tracking-tight md:text-4xl">{legal.docT}</h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {(legal.docs as string[]).map((d) => (
            <div key={d}>
              <div className="mb-3.5 flex aspect-[3/4] items-end overflow-hidden rounded-[10px] border border-line bg-tint p-3 text-xs text-faint">
                {locale === 'en' ? 'Document scan' : 'Scan dokumen'}
              </div>
              <div className="text-base font-bold">{d}</div>
            </div>
          ))}
        </div>
      </Container>

      <CtaBand locale={locale as Locale} />
    </>
  );
}
