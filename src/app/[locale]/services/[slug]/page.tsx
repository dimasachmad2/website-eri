import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/Container';
import { HeroBanner } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { Faq } from '@/components/home/Faq';
import { Icon } from '@/components/Icon';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import {
  getSite, COMPANY, ROUTES, SITE_URL, WHATSAPP, LANDLINE_TEL, LANDLINE_DISPLAY, type Locale,
} from '@/content/site';
import { getService, getServices, ICONS, SERVICE_SLUGS } from '@/content/services';
import { getArticles } from '@/lib/articles';

type Params = { locale: string; slug: string };

export const dynamicParams = false;
export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

const path = (l: string, slug: string) => `/${l}${ROUTES.services}/${slug}/`;
// Jeda bertahap untuk animasi muncul (dibaca CSS sebagai --rd).
const delay = (i: number, step = 90) => ({ '--rd': `${i * step}ms` }) as CSSProperties;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = getService(slug, locale as Locale);
  if (!s) return {};
  const title = `${s.metaTitle} | Enviro Resources`;
  return {
    title: { absolute: title },
    description: s.metaDesc,
    alternates: {
      canonical: path(locale, slug),
      languages: { id: path('id', slug), en: path('en', slug) },
    },
    openGraph: {
      type: 'website',
      title,
      description: s.metaDesc,
      url: `${SITE_URL}${path(locale, slug)}`,
      siteName: COMPANY,
      locale: locale === 'en' ? 'en_US' : 'id_ID',
      images: [s.photo],
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const s = getService(slug, l);
  if (!s) notFound();

  const { nav } = getSite(l);
  const en = l === 'en';
  const T = (id: string, enText: string) => (en ? enText : id);
  const url = `${SITE_URL}${path(l, slug)}`;
  const m = s.media;

  const waText = en
    ? `Hello ERI, I would like to consult about ${s.waTopic}.`
    : `Halo ERI, saya ingin konsultasi tentang ${s.waTopic}.`;
  const waHref = `${WHATSAPP}?text=${encodeURIComponent(waText)}`;

  const others = getServices(l).filter((x) => x.slug !== s.slug);
  const articles = getArticles(l)
    .filter((a) => s.articleKeywords.some((k) => a.title.toLowerCase().includes(k)))
    .slice(0, 3);

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: s.title,
      serviceType: s.serviceType,
      description: s.metaDesc,
      url,
      image: `${SITE_URL}${s.photo}`,
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: ['Sidoarjo', 'Surabaya', 'Gresik', 'Jawa Timur'].map((name) => ({ '@type': 'AdministrativeArea', name })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: nav.services, item: `${SITE_URL}/${l}${ROUTES.services}/` },
        { '@type': 'ListItem', position: 2, name: s.short, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: s.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  const eyebrow = 'mb-3 text-sm font-bold uppercase tracking-wide text-brand';
  const h2 = 'm-0 text-3xl font-extrabold tracking-tight md:text-4xl';
  const pills = [T('ISO 9001 · 14001 · 45001', 'ISO 9001 · 14001 · 45001'), T('Kantor di Sidoarjo', 'Office in Sidoarjo'), T('Kajian hingga konstruksi', 'Study to construction')];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <RevealOnScroll key={slug} />

      <HeroBanner title={s.title} sub={s.sub} crumbs={[nav.services, s.short]} img={s.photo} imgAlt={m.heroAlt} animate>
        <div data-cta="svc_hero" className="mt-9 flex flex-wrap gap-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-lg bg-brand-bright px-6 py-4 font-bold text-white transition-transform hover:-translate-y-0.5 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.05 21.5a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.43 9.43 0 0 1 9.43 9.44c0 5.2-4.23 9.43-9.45 9.43zm8.03-17.46A11.3 11.3 0 0 0 12.05.72C5.8.72.7 5.8.7 12.07c0 2 .52 3.95 1.52 5.67L.6 23.64l6.04-1.58a11.3 11.3 0 0 0 5.4 1.38c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.03z" />
            </svg>
            {T('Konsultasi via WhatsApp', 'Consult via WhatsApp')}
          </a>
          <a
            href={LANDLINE_TEL}
            className="inline-flex items-center gap-2.5 rounded-lg border border-white/40 px-6 py-4 font-semibold text-white transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
            </svg>
            {LANDLINE_DISPLAY}
          </a>
        </div>
      </HeroBanner>

      {/* ── Kapan dibutuhkan ─────────────────────────────────── */}
      <Container className="grid grid-cols-1 gap-12 pt-20 lg:grid-cols-[5fr_6fr] lg:gap-16">
        <div>
          <div data-reveal>
            <div className={eyebrow}>{T('Kebutuhan', 'When it applies')}</div>
            <h2 className={h2}>{s.who.title}</h2>
            {s.who.note && <p className="m-0 mt-5 text-[15px] leading-relaxed text-muted">{s.who.note}</p>}
          </div>
          <div data-reveal style={delay(2)} className="relative mt-10 pb-6">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-tint">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.side} alt={m.sideAlt} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div
              className="absolute bottom-0 right-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_14px_40px_rgba(14,42,26,0.18)] md:-right-6"
              style={{ animation: 'floatY 5s ease-in-out infinite' }}
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-badge text-brand">
                <Icon paths={ICONS.shield} className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-faint">{T('Bersertifikat', 'Certified')}</span>
                <span className="block text-sm font-extrabold text-ink">ISO 9001 · 14001 · 45001</span>
              </span>
            </div>
          </div>
        </div>
        <ul className="m-0 flex list-none flex-col gap-3 self-center p-0">
          {s.who.items.map((item, i) => (
            <li key={item} data-reveal style={delay(i)}>
              <div className="flex gap-4 rounded-xl border border-line bg-white p-5 text-[15px] leading-relaxed transition-colors hover:border-brand">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">
                  ✓
                </span>
                <span>{item}</span>
              </div>
            </li>
          ))}
        </ul>
      </Container>

      {/* ── Lingkup layanan ──────────────────────────────────── */}
      <Container className="pt-24">
        <div data-reveal>
          <div className={eyebrow}>{T('Lingkup layanan', 'Scope of service')}</div>
          <h2 className={`${h2} mb-9`}>{T('Yang kami kerjakan untuk Anda', 'What we do for you')}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.scope.map((x, i) => (
            <div key={x.t} data-reveal style={delay(i % 3)}>
              <div className="group h-full rounded-xl border border-line bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[0_18px_40px_rgba(14,42,26,0.10)]">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-badge text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                    <Icon paths={ICONS[m.icons[i] ?? 'doc']} className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-extrabold text-faint">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="mb-2 text-lg font-bold leading-snug">{x.t}</div>
                <div className="text-sm leading-relaxed text-muted">{x.d}</div>
              </div>
            </div>
          ))}
        </div>
        {s.notice && (
          <p data-reveal className="m-0 mt-6 flex gap-3 rounded-xl bg-tint p-5 text-sm leading-relaxed text-muted">
            <span className="font-extrabold text-brand">i</span>
            {s.notice}
          </p>
        )}
      </Container>

      {/* ── Pita foto ────────────────────────────────────────── */}
      <section data-reveal-zoom className="relative mt-24 overflow-hidden bg-forest">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.band} alt={m.bandAlt} loading="lazy" className="rv-img absolute inset-0 h-full w-full object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(90deg,rgba(14,42,26,.94) 0%,rgba(14,42,26,.78) 45%,rgba(14,42,26,.25) 100%)' }}
        />
        <Container className="relative py-24 md:py-32">
          <div data-reveal className="max-w-[640px] text-white">
            <div className="mb-4 text-sm font-bold uppercase tracking-wide text-soft">PT Enviro Resources Indonesia</div>
            <p className="m-0 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{m.bandText}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {pills.map((p) => (
                <span key={p} className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Alur kerja ───────────────────────────────────────── */}
      <Container className="pt-24">
        <div data-reveal>
          <div className={eyebrow}>{T('Alur kerja', 'How it works')}</div>
          <h2 className={`${h2} mb-10`}>{T('Tahapan pendampingan', 'Our process')}</h2>
        </div>
        <div data-reveal-line className="relative">
          <div className="h-0.5 w-full bg-line">
            <div className="rv-fill h-full w-full bg-brand" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {s.steps.map((x, i) => (
              <div key={x.t} data-reveal style={delay(i, 140)} className="relative pr-6 pt-8">
                <span className="absolute -top-[7px] left-0 hidden h-3 w-3 rounded-full bg-brand ring-4 ring-white lg:block" />
                <div className="mb-3.5 text-4xl font-extrabold text-brand">{String(i + 1).padStart(2, '0')}</div>
                <div className="mb-2 text-[17px] font-bold">{x.t}</div>
                <div className="text-sm leading-relaxed text-muted">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* ── Data yang perlu disiapkan ────────────────────────── */}
      <Container className="pt-24">
        <div data-reveal className="relative overflow-hidden rounded-2xl bg-forest p-8 text-white md:p-14">
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0 w-1/2"
            style={{
              backgroundImage: 'radial-gradient(rgba(143,220,147,.16) 1px,transparent 1px)',
              backgroundSize: '22px 22px',
              WebkitMaskImage: 'linear-gradient(270deg,#000,transparent)',
              maskImage: 'linear-gradient(270deg,#000,transparent)',
            }}
          />
          <div className="relative">
            <div className="mb-3 text-sm font-bold uppercase tracking-wide text-soft">{T('Persiapan', 'Preparation')}</div>
            <h2 className="m-0 mb-3 text-2xl font-extrabold tracking-tight md:text-3xl">
              {T('Data yang sebaiknya disiapkan', 'Information to prepare')}
            </h2>
            <p className="m-0 mb-8 max-w-[720px] text-base leading-relaxed text-ondark">
              {T(
                'Belum lengkap tidak masalah. Kirim yang sudah ada, dan kami bantu menyusun daftar kekurangannya.',
                'It does not need to be complete. Send what you have and we will help list what is missing.',
              )}
            </p>
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              {s.prep.map((p) => (
                <div key={p} className="flex items-start gap-3 border-b border-dark2 py-3.5 text-[15px]">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border border-soft text-[10px] font-extrabold text-soft">
                    ✓
                  </span>
                  {p}
                </div>
              ))}
            </div>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="svc_prep"
              className="mt-9 inline-block rounded-lg bg-white px-6 py-4 font-bold text-forest transition-transform hover:-translate-y-0.5 hover:text-forest"
            >
              {T('Kirim data via WhatsApp', 'Send your data via WhatsApp')}
            </a>
          </div>
        </div>
      </Container>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <Container className="pt-24">
        <div data-reveal>
          <Faq
            title={T(`Pertanyaan seputar ${s.short}`, `Questions about ${s.short}`)}
            sub={T('Belum terjawab? Tanyakan langsung ke tim kami.', 'Still have questions? Ask our team directly.')}
            cta={T('Tanya via WhatsApp', 'Ask via WhatsApp')}
            list={s.faq}
          />
        </div>
      </Container>

      {/* ── Layanan & artikel terkait ────────────────────────── */}
      <Container className="pt-24">
        <div data-reveal className={eyebrow}>{T('Layanan lainnya', 'Other services')}</div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {others.map((o, i) => (
            <div key={o.slug} data-reveal style={delay(i)}>
              <Link
                href={`${ROUTES.services}/${o.slug}`}
                className="group block h-full overflow-hidden rounded-xl border border-line bg-white text-ink transition duration-300 hover:-translate-y-1 hover:border-brand hover:text-ink hover:shadow-[0_18px_40px_rgba(14,42,26,0.10)]"
              >
                <div className="aspect-[16/9] overflow-hidden bg-tint">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.photo}
                    alt={o.media.heroAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <span className="text-[17px] font-bold leading-snug">{o.short}</span>
                  <span className="text-brand transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
        {articles.length > 0 && (
          <div data-reveal>
            <div className={`${eyebrow} mt-14`}>{T('Artikel terkait', 'Related articles')}</div>
            <div className="flex flex-col">
              {articles.map((a) => (
                <Link
                  key={a.slug}
                  href={`${ROUTES.articles}/${a.slug}`}
                  className="group flex items-center justify-between gap-6 border-t border-line py-4 text-lg font-bold text-ink last:border-b hover:text-brand"
                >
                  {a.title}
                  <span className="text-brand transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <Link href={ROUTES.services} className="mt-8 inline-block font-bold">
          ← {T('Semua layanan', 'All services')}
        </Link>
      </Container>

      <CtaBand locale={l} />
    </>
  );
}
