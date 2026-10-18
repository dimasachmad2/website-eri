import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/Container';
import { HeroBanner } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { Faq } from '@/components/home/Faq';
import {
  getSite, COMPANY, ROUTES, SITE_URL, WHATSAPP, LANDLINE_TEL, LANDLINE_DISPLAY, type Locale,
} from '@/content/site';
import { getService, getServices, SERVICE_SLUGS } from '@/content/services';
import { getArticles } from '@/lib/articles';

type Params = { locale: string; slug: string };

export const dynamicParams = false;
export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

const path = (l: string, slug: string) => `/${l}${ROUTES.services}/${slug}/`;

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <HeroBanner title={s.title} sub={s.sub} crumbs={[nav.services, s.short]} img={s.photo}>
        <div data-cta="svc_hero" className="mt-9 flex flex-wrap gap-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-brand-bright px-6 py-4 font-bold text-white hover:text-white"
          >
            {T('Konsultasi via WhatsApp', 'Consult via WhatsApp')}
          </a>
          <a
            href={LANDLINE_TEL}
            className="rounded-lg border border-white/40 px-6 py-4 font-semibold text-white hover:bg-white/10 hover:text-white"
          >
            {T('Telepon', 'Call')} {LANDLINE_DISPLAY}
          </a>
        </div>
      </HeroBanner>

      {/* Kapan dibutuhkan */}
      <Container className="grid grid-cols-1 gap-10 pt-20 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div>
          <div className={eyebrow}>{T('Kebutuhan', 'When it applies')}</div>
          <h2 className={h2}>{s.who.title}</h2>
          {s.who.note && <p className="m-0 mt-5 text-[15px] leading-relaxed text-muted">{s.who.note}</p>}
        </div>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {s.who.items.map((item) => (
            <li key={item} className="flex gap-4 rounded-xl border border-line p-5 text-[15px] leading-relaxed">
              <span className="mt-0.5 font-extrabold text-brand">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Container>

      {/* Lingkup pendampingan */}
      <Container className="pt-24">
        <div className={eyebrow}>{T('Lingkup layanan', 'Scope of service')}</div>
        <h2 className={`${h2} mb-9`}>{T('Yang kami kerjakan untuk Anda', 'What we do for you')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.scope.map((x, i) => (
            <div key={x.t} className="rounded-xl border border-line p-7">
              <div className="mb-3 text-sm font-extrabold text-brand">{String(i + 1).padStart(2, '0')}</div>
              <div className="mb-2 text-lg font-bold leading-snug">{x.t}</div>
              <div className="text-sm leading-relaxed text-muted">{x.d}</div>
            </div>
          ))}
        </div>
        {s.notice && (
          <p className="m-0 mt-6 rounded-xl bg-tint p-5 text-sm leading-relaxed text-muted">{s.notice}</p>
        )}
      </Container>

      {/* Alur kerja */}
      <Container className="pt-24">
        <div className={eyebrow}>{T('Alur kerja', 'How it works')}</div>
        <h2 className={`${h2} mb-10`}>{T('Tahapan pendampingan', 'Our process')}</h2>
        <div className="grid grid-cols-1 border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-5">
          {s.steps.map((x, i) => (
            <div key={x.t} className="pr-6 pt-6">
              <div className="mb-3.5 text-4xl font-extrabold text-brand">{String(i + 1).padStart(2, '0')}</div>
              <div className="mb-2 text-[17px] font-bold">{x.t}</div>
              <div className="text-sm leading-relaxed text-muted">{x.d}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* Data yang perlu disiapkan */}
      <Container className="pt-24">
        <div className="rounded-2xl bg-forest p-8 text-white md:p-14">
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
              <div key={p} className="flex gap-3 border-b border-dark2 py-3 text-[15px]">
                <span className="font-extrabold text-soft">✓</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* FAQ */}
      <Container className="pt-24">
        <Faq
          title={T(`Pertanyaan seputar ${s.short}`, `Questions about ${s.short}`)}
          sub={T('Belum terjawab? Tanyakan langsung ke tim kami.', 'Still have questions? Ask our team directly.')}
          cta={T('Tanya via WhatsApp', 'Ask via WhatsApp')}
          list={s.faq}
        />
      </Container>

      {/* Layanan & artikel terkait */}
      <Container className="pt-24">
        <div className={eyebrow}>{T('Layanan lainnya', 'Other services')}</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`${ROUTES.services}/${o.slug}`}
              className="flex min-h-[110px] flex-col justify-between gap-4 rounded-[10px] border border-line p-6 text-ink transition-colors hover:border-brand hover:text-ink"
            >
              <div className="text-[17px] font-bold leading-snug">{o.short}</div>
              <div className="text-sm font-bold text-brand">{T('Selengkapnya', 'Learn more')} →</div>
            </Link>
          ))}
        </div>
        {articles.length > 0 && (
          <>
            <div className={`${eyebrow} mt-14`}>{T('Artikel terkait', 'Related articles')}</div>
            <div className="flex flex-col">
              {articles.map((a) => (
                <Link
                  key={a.slug}
                  href={`${ROUTES.articles}/${a.slug}`}
                  className="border-t border-line py-4 text-lg font-bold text-ink last:border-b hover:text-brand"
                >
                  {a.title}
                </Link>
              ))}
            </div>
          </>
        )}
        <Link href={ROUTES.services} className="mt-8 inline-block font-bold">
          ← {T('Semua layanan', 'All services')}
        </Link>
      </Container>

      <CtaBand locale={l} />
    </>
  );
}
