import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/Container';
import { Icon } from '@/components/Icon';
import { CtaBand } from '@/components/CtaBand';
import { MethodStepper } from '@/components/home/MethodStepper';
import { Testimonials } from '@/components/home/Testimonials';
import { Faq } from '@/components/home/Faq';
import { getSite, ROUTES, CLIENTS, type Locale } from '@/content/site';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const site = getSite(locale as Locale);
  const { t, allServices, methodSteps, homeProjects, heroPhoto, stageWord } = site;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[600px] items-center overflow-hidden bg-forest">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroPhoto.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg,rgba(14,42,26,.95) 0%,rgba(14,42,26,.75) 50%,rgba(14,42,26,.15) 100%)',
          }}
        />
        <Container className="relative py-24">
          <div className="max-w-[700px] text-white">
            <div className="mb-6 text-sm font-bold uppercase tracking-wide text-soft">
              {t.hero.eyebrow}
            </div>
            <h1 className="m-0 mb-6 text-[clamp(40px,5.4vw,64px)] font-extrabold leading-[1.04] tracking-tight">
              Solutions for a Greener Tomorrow
            </h1>
            <p className="m-0 mb-9 max-w-[600px] text-lg leading-relaxed text-ondark">{t.hero.sub}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.contact}
                className="rounded-lg bg-brand-bright px-6 py-4 font-bold text-white hover:text-white"
              >
                {t.hero.b1}
              </Link>
              <a
                href="/company-profile.pdf"
                download
                className="rounded-lg border border-white/40 px-6 py-4 font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                {t.hero.b2}
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Kartu fokus ──────────────────────────────────────── */}
      <Container className="mt-12">
        <div className="grid grid-cols-1 overflow-hidden rounded-xl bg-white shadow-[0_20px_50px_rgba(14,42,26,0.12)] md:grid-cols-3">
          {t.focus.map((f: { n: string; t: string; d: string; iconPaths: string }) => (
            <div key={f.n} className="border-b border-line p-8 md:border-b-0 md:border-r md:last:border-r-0">
              <div className="mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-badge text-brand">
                <Icon paths={f.iconPaths} className="h-[26px] w-[26px]" />
              </div>
              <div className="mb-2 text-[19px] font-bold">{f.t}</div>
              <div className="text-sm leading-relaxed text-muted">{f.d}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* ── Klien ────────────────────────────────────────────── */}
      <Container className="pt-24">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex-none text-sm font-bold uppercase tracking-wide text-faint">
            {t.clients.label}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {CLIENTS.map((c) => (
              <div
                key={c.logo}
                className="flex h-[72px] items-center justify-center rounded-[10px] border border-line bg-white p-3 opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo} alt={c.name} className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* ── Preview layanan ──────────────────────────────────── */}
      <Container className="pt-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">
              {t.home.svcEyebrow}
            </div>
            <h2 className="m-0 text-3xl font-extrabold tracking-tight md:text-4xl">{t.home.svcTitle}</h2>
          </div>
          <Link href={ROUTES.services} className="font-bold">
            {t.home.svcAll} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allServices.map((sv, i) => (
            <Link
              key={i}
              href={ROUTES.services}
              className="flex min-h-[128px] flex-col justify-between gap-4 rounded-[10px] border border-line p-6 text-ink transition-colors hover:border-brand hover:text-ink"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-faint">{sv.cat}</div>
              <div className="text-[17px] font-bold leading-snug">{sv.t}</div>
            </Link>
          ))}
        </div>
      </Container>

      {/* ── Metode ───────────────────────────────────────────── */}
      <Container className="pt-28">
        <MethodStepper
          steps={methodSteps}
          eyebrow={t.method.eyebrow}
          title={t.method.title}
          note={t.method.note}
          stageWord={stageWord}
        />
      </Container>

      {/* ── Preview portofolio ───────────────────────────────── */}
      <Container className="pt-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">
              {t.home.pfEyebrow}
            </div>
            <h2 className="m-0 text-3xl font-extrabold tracking-tight md:text-4xl">{t.home.pfTitle}</h2>
          </div>
          <Link href={ROUTES.portfolio} className="font-bold">
            {t.home.pfAll} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeProjects.map((p) => (
            <div key={p.key}>
              <div className="mb-4 h-[260px] overflow-hidden rounded-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="mb-1.5 text-xs font-bold text-brand">{p.tag}</div>
              <div className="mb-1 text-[17px] font-bold">{p.t}</div>
              <div className="text-sm text-faint">{p.loc}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* ── Testimoni ────────────────────────────────────────── */}
      <Testimonials
        eyebrow={t.testi.eyebrow}
        title={t.testi.title}
        list={t.testi.list}
      />

      {/* ── Sektor ───────────────────────────────────────────── */}
      <Container className="pt-28">
        <div className="mb-10 flex flex-col gap-4">
          <div>
            <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">
              {t.sectors.eyebrow}
            </div>
            <h2 className="m-0 text-3xl font-extrabold tracking-tight md:text-4xl">{t.sectors.title}</h2>
          </div>
          <p className="m-0 max-w-[560px] text-[15px] leading-relaxed text-muted">{t.sectors.note}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.sectors.list.map((s: { n: string; t: string; img: string }) => (
            <div
              key={s.n}
              className="group relative h-[220px] overflow-hidden rounded-xl bg-forest transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(14,42,26,0.28)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.img}
                alt=""
                className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-110"
              />
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                style={{
                  background:
                    'linear-gradient(to top,rgba(14,42,26,.92) 0%,rgba(14,42,26,.35) 55%,rgba(14,42,26,.05) 100%)',
                }}
              />
              <div className="absolute bottom-[18px] left-5 right-5 text-white transition-transform duration-300 group-hover:-translate-y-1">
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-soft">{s.n}</div>
                <div className="text-lg font-bold leading-snug">{s.t}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <Container className="pt-28">
        <Faq title={t.faq.title} sub={t.faq.sub} cta={t.faq.cta} list={t.faq.list} />
      </Container>

      {/* ── CTA band ─────────────────────────────────────────── */}
      <CtaBand locale={locale as Locale} />
    </>
  );
}
