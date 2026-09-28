import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { PortfolioBoard } from '@/components/PortfolioBoard';
import { getPortfolio, metaFor, type Locale } from '@/content/site';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return metaFor(locale as Locale, 'portfolio');
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { clients, stats, ui } = getPortfolio(locale as Locale);

  return (
    <>
      <PageHero locale={locale as Locale} page="portfolio" />
      <Container className="pt-16">
        <PortfolioBoard clients={clients} stats={stats} ui={ui} />
      </Container>
      <CtaBand locale={locale as Locale} />
    </>
  );
}
