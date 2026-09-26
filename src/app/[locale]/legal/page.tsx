import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { Icon } from '@/components/Icon';
import { getSite, metaFor, ISO_CERTS, type Locale } from '@/content/site';

const AWARD = '<circle cx="12" cy="8" r="5"/><path d="M8.5 12.5 7 21l5-3 5 3-1.5-8.5"/>';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return metaFor(locale as Locale, 'legal');
}

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

      {/* Sertifikasi ISO */}
      <Container className="pt-24">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">
          {locale === 'en' ? 'ISO CERTIFICATIONS' : 'SERTIFIKASI ISO'}
        </div>
        <h2 className="m-0 mb-9 text-3xl font-extrabold tracking-tight md:text-4xl">
          {locale === 'en' ? 'Certified management systems' : 'Sistem manajemen tersertifikasi'}
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {ISO_CERTS.map((c) => (
            <a
              key={c.code}
              href={c.file}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-line p-7 text-ink transition-all hover:-translate-y-1 hover:border-brand hover:text-ink hover:shadow-[0_16px_40px_rgba(14,42,26,0.1)]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-badge text-brand">
                <Icon paths={AWARD} className="h-6 w-6" />
              </div>
              <div className="text-xl font-extrabold">{c.code}</div>
              <div className="mb-8 text-sm text-muted">{locale === 'en' ? c.en : c.id}</div>
              <div className="mt-auto text-sm font-bold text-brand">
                {locale === 'en' ? 'View certificate' : 'Lihat sertifikat'} →
              </div>
            </a>
          ))}
        </div>
      </Container>

      {/* Dokumen legal (daftar) */}
      <Container className="pt-24">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">{legal.docL}</div>
        <h2 className="m-0 mb-6 text-3xl font-extrabold tracking-tight md:text-4xl">{legal.docT}</h2>
        <div className="flex flex-wrap gap-3">
          {(legal.docs as string[]).map((d) => (
            <span key={d} className="rounded-full border border-line bg-tint px-5 py-3 text-sm font-bold">
              {d}
            </span>
          ))}
        </div>
      </Container>

      <CtaBand locale={locale as Locale} />
    </>
  );
}
