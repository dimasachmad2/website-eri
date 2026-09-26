import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { getSite, metaFor, type Locale } from '@/content/site';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return metaFor(locale as Locale, 'team');
}

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { team } = getSite(locale as Locale);

  return (
    <>
      <PageHero locale={locale as Locale} page="team" />
      <Container className="pt-20">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {team.map((name) => (
            <div key={name}>
              <div className="mb-3.5 aspect-[4/5] overflow-hidden rounded-[10px] bg-tint" />
              <div className="text-base font-bold leading-snug">{name}</div>
            </div>
          ))}
        </div>
      </Container>
      <CtaBand locale={locale as Locale} />
    </>
  );
}
