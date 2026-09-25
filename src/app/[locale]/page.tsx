import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <main className="min-h-screen">
      {/* Hero — verifikasi token 1b Korporat (dark forest + aksen hijau) */}
      <section className="relative overflow-hidden bg-forest text-white">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg,#123421 0 14px,#0f2e1c 14px 28px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg,rgba(9,30,18,.94) 0%,rgba(9,30,18,.7) 55%,rgba(9,30,18,.1) 100%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-28 md:py-36">
          <div className="mb-6 inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide text-brand-light">
            <span className="h-0.5 w-7 bg-brand-bright" />
            {t('eyebrow')}
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ondark">{t('subtitle')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <span className="rounded-lg bg-brand-bright px-6 py-4 font-bold text-forest">
              {t('cta')}
            </span>
            <span className="rounded-lg border border-white/35 px-6 py-4 font-semibold">
              {t('cta2')}
            </span>
          </div>
        </div>
      </section>

      {/* Penanda status fondasi */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold tracking-wide text-brand">FASE 0 · FONDASI</p>
        <h2 className="mt-2 text-2xl font-extrabold">{t('status_title')}</h2>
        <p className="mt-3 max-w-2xl text-muted">{t('status_body')}</p>
        <p className="mt-4 font-mono text-sm text-faint">locale: {locale}</p>
      </section>
    </main>
  );
}
