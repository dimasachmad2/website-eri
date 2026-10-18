import type { CSSProperties, ReactNode } from 'react';
import { Container } from './Container';
import { pageHero, type Locale, type PageKey } from '@/content/site';

export function PageHero({ locale, page }: { locale: Locale; page: PageKey }) {
  const { title, sub, crumbs, photo } = pageHero(locale, page);
  return <HeroBanner title={title} sub={sub} crumbs={crumbs} img={photo.img} />;
}

export function HeroBanner({
  title,
  sub,
  crumbs,
  img,
  imgAlt = '',
  animate = false,
  children,
}: {
  title: string;
  sub: string;
  crumbs: string[];
  img: string;
  imgAlt?: string;
  animate?: boolean; // foto zoom perlahan + teks muncul bertahap (CSS saja, tanpa JS)
  children?: ReactNode;
}) {
  const up = (delay: number): CSSProperties | undefined =>
    animate ? { animation: `fadeUp .8s cubic-bezier(.2,.7,.2,1) ${delay}s both` } : undefined;

  return (
    <section className="relative overflow-hidden bg-forest text-white">
      {/* Foto kanan ter-mask */}
      <div
        className="absolute bottom-0 right-0 top-0 w-[58%] overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(90deg,transparent 0%,#000 45%)',
          maskImage: 'linear-gradient(90deg,transparent 0%,#000 45%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={imgAlt}
          className="h-full w-full object-cover"
          style={animate ? { animation: 'heroZoom 14s cubic-bezier(.2,.7,.2,1) both' } : undefined}
        />
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
        <div className="mb-7 flex flex-wrap items-center gap-2 text-sm font-semibold" style={up(0.05)}>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#8fdc93" strokeWidth="1.6" aria-hidden="true">
                  <path d="M4.5 2.5L8 6l-3.5 3.5" />
                </svg>
              )}
              <span className={i === crumbs.length - 1 ? 'text-soft' : 'text-ondark'}>{c}</span>
            </span>
          ))}
        </div>
        <h1
          className="m-0 max-w-[760px] text-4xl font-extrabold leading-[1.06] tracking-tight md:text-5xl"
          style={up(0.15)}
        >
          {title}
        </h1>
        <div className="mt-6 flex max-w-[640px] gap-4" style={up(0.3)}>
          <span className="w-[3px] flex-none rounded bg-brand-bright" />
          <p className="m-0 text-lg leading-relaxed text-ondark">{sub}</p>
        </div>
        {children && <div style={up(0.45)}>{children}</div>}
      </Container>
    </section>
  );
}
