import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { getSite, metaFor, type Locale } from '@/content/site';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return metaFor(locale as Locale, 'team');
}

// Inisial dari nama (abaikan gelar setelah koma), mis. "Dian Retno Hapsari, S.T" → "DR".
function initials(name: string) {
  const parts = name.split(',')[0].trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase().replace(/[^A-Z]/g, '');
}

// Variasi gradasi hijau brand supaya grid tidak monoton.
const GRADIENTS = [
  'linear-gradient(135deg,#0e2a1a 0%,#23862a 100%)',
  'linear-gradient(135deg,#23862a 0%,#4fc255 100%)',
  'linear-gradient(135deg,#153d27 0%,#0e2a1a 100%)',
];

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { team } = getSite(locale as Locale);

  return (
    <>
      <PageHero locale={locale as Locale} page="team" />
      <Container className="pt-20">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {team.map((name, i) => (
            <div key={name} className="group">
              {/* Avatar inisial — placeholder sementara foto asli menyusul */}
              <div
                className="relative mb-3.5 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[10px] transition-transform duration-300 group-hover:-translate-y-1"
                style={{ background: GRADIENTS[i % GRADIENTS.length] }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(143,220,147,.22) 1px,transparent 1px)',
                    backgroundSize: '18px 18px',
                  }}
                />
                <span className="relative text-4xl font-extrabold tracking-tight text-white/95">
                  {initials(name)}
                </span>
              </div>
              <div className="text-base font-bold leading-snug">{name}</div>
            </div>
          ))}
        </div>
      </Container>
      <CtaBand locale={locale as Locale} />
    </>
  );
}
