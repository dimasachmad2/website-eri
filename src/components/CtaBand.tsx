import { Link } from '@/i18n/navigation';
import { Container } from './Container';
import { getSite, ROUTES, WHATSAPP, PHONE_DISPLAY, type Locale } from '@/content/site';

export function CtaBand({ locale }: { locale: Locale }) {
  const { t, cities } = getSite(locale);

  return (
    <Container className="pt-28">
      <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-2xl bg-forest px-8 py-20 text-white md:px-14 md:py-24">
        {/* Peta titik Indonesia */}
        <div className="pointer-events-none absolute right-[-3%] top-1/2 aspect-[1200/480] w-[min(860px,74%)] -translate-y-1/2">
          <div
            className="absolute inset-0 bg-soft"
            style={{
              WebkitMaskImage: 'url(/indonesia-dots.svg)',
              maskImage: 'url(/indonesia-dots.svg)',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
            }}
          />
          {cities.map((c) => (
            <div key={c.name} className="absolute h-0 w-0" style={{ left: c.x, top: c.y }}>
              <span
                className="absolute left-[-5px] top-[-5px] h-2.5 w-2.5 rounded-full bg-white"
                style={{ animation: `mNode 2.4s ${c.delay}s infinite` }}
              />
              {c.label && (
                <span className="absolute left-2.5 top-[-9px] whitespace-nowrap text-xs font-bold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
                  {c.name}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Overlay gradient agar teks terbaca */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg,rgba(14,42,26,1) 0%,rgba(14,42,26,.85) 36%,rgba(14,42,26,0) 68%)',
          }}
        />

        <div className="relative max-w-[620px]">
          <div className="mb-4 text-sm font-bold uppercase tracking-wide text-soft">
            {t.nav.contact}
          </div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            {t.ctaBand}
          </h2>
        </div>
        <div className="relative flex flex-wrap gap-3">
          <a
            href={WHATSAPP}
            className="rounded-lg bg-white px-6 py-4 font-bold text-forest hover:text-forest"
          >
            WhatsApp {PHONE_DISPLAY}
          </a>
          <Link
            href={ROUTES.contact}
            className="rounded-lg border border-white/50 px-6 py-4 font-bold text-white hover:bg-white/10 hover:text-white"
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </Container>
  );
}
