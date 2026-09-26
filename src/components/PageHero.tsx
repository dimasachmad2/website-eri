import { Link } from '@/i18n/navigation';
import { Container } from './Container';
import { pageHero, type Locale, type PageKey } from '@/content/site';

export function PageHero({ locale, page }: { locale: Locale; page: PageKey }) {
  const { title, sub, crumbs, photo } = pageHero(locale, page);
  const homeLabel = locale === 'en' ? 'Home' : 'Beranda';

  return (
    <section className="relative overflow-hidden bg-forest text-white">
      {/* Foto kanan ter-mask */}
      <div
        className="absolute bottom-0 right-0 top-0 w-[58%]"
        style={{
          WebkitMaskImage: 'linear-gradient(90deg,transparent 0%,#000 45%)',
          maskImage: 'linear-gradient(90deg,transparent 0%,#000 45%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.img} alt="" className="h-full w-full object-cover" />
      </div>
      {/* Overlay gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg,rgba(14,42,26,1) 35%,rgba(14,42,26,.55) 70%,rgba(14,42,26,.25) 100%)',
        }}
      />
      {/* Titik radial kiri */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 w-[45%]"
        style={{
          backgroundImage: 'radial-gradient(rgba(143,220,147,.14) 1px,transparent 1px)',
          backgroundSize: '22px 22px',
          WebkitMaskImage: 'linear-gradient(90deg,#000,transparent)',
          maskImage: 'linear-gradient(90deg,#000,transparent)',
        }}
      />

      <Container className="relative flex min-h-[420px] flex-col justify-center py-24">
        <div className="mb-7 flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link href="/" className="text-ondark hover:text-white">{homeLabel}</Link>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#8fdc93" strokeWidth="1.6" aria-hidden="true">
                <path d="M4.5 2.5L8 6l-3.5 3.5" />
              </svg>
              <span className={i === crumbs.length - 1 ? 'text-soft' : 'text-ondark'}>{c}</span>
            </span>
          ))}
        </div>
        <h1 className="m-0 max-w-[760px] text-4xl font-extrabold leading-[1.06] tracking-tight md:text-5xl">
          {title}
        </h1>
        <div className="mt-6 flex max-w-[640px] gap-4">
          <span className="w-[3px] flex-none rounded bg-brand-bright" />
          <p className="m-0 text-lg leading-relaxed text-ondark">{sub}</p>
        </div>
      </Container>
    </section>
  );
}
