import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { PortfolioGrid } from '@/components/PortfolioGrid';
import { getSite, type Locale } from '@/content/site';

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t, projects } = getSite(locale as Locale);

  return (
    <>
      <PageHero locale={locale as Locale} page="portfolio" />
      <Container className="pt-16">
        <PortfolioGrid filters={t.filters} projects={projects} />
      </Container>
      <CtaBand locale={locale as Locale} />
    </>
  );
}
