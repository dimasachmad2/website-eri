import type { Metadata } from 'next';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppFloat } from '@/components/WhatsAppFloat';
import { ConversionTracker } from '@/components/ConversionTracker';
import { getSite, SITE_URL, COMPANY, GTM_ID, EMAIL, LANDLINE_TEL, type Locale } from '@/content/site';
import '../globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: COMPANY,
    template: `%s · ${COMPANY}`,
  },
  description:
    'Konsultan lingkungan — pendampingan perizinan, dokumen lingkungan, dan prasarana pengolahan limbah. Solutions for a Greener Tomorrow.',
  openGraph: {
    type: 'website',
    siteName: COMPANY,
    images: ['/photos/1774789599304-cca1e1ffbb95.jpg'],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  verification: { google: '4ayvO_n9NzqIeKdzJtV-q2oJh8mpKlazVqVjWUOFtAA' },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const { nav, t } = getSite(locale as Locale);
  const aboutOverview = locale === 'en' ? 'Company Overview' : 'Sekilas Perusahaan';

  // Structured data (schema.org) — bantu Google memahami bisnis & SEO lokal.
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#organization`,
    name: COMPANY,
    alternateName: 'Enviro Resources Indonesia',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    image: `${SITE_URL}/photos/1774789599304-cca1e1ffbb95.jpg`,
    telephone: LANDLINE_TEL.replace('tel:', ''),
    email: EMAIL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jl. Tropodo Indah J-19, Waru',
      addressLocality: 'Sidoarjo',
      addressRegion: 'Jawa Timur',
      addressCountry: 'ID',
    },
    areaServed: ['Sidoarjo', 'Surabaya', 'Gresik', 'Jawa Timur', 'Indonesia'],
    description:
      'Konsultan lingkungan: AMDAL, UKL-UPL, SPPL, Persetujuan Teknis air limbah & emisi, SLO, Rincian Teknis Limbah B3, Andalalin, prasarana pengolahan limbah (IPAL), dan pengelolaan limbah non-B3.',
    knowsAbout: ['AMDAL', 'UKL-UPL', 'SPPL', 'Persetujuan Teknis', 'SLO', 'Rincian Teknis Limbah B3', 'Andalalin', 'PROPER', 'IPAL', 'Audit Lingkungan'],
  };

  return (
    <html lang={locale} className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body>
        {/* Google Tag Manager — GA4 & Ads dikonfigurasi di dalam GTM */}
        <Script
          id="gtm-base"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header nav={nav} cta={t.cta} aboutOverview={aboutOverview} />
            <main className="flex-1">{children}</main>
            <Footer locale={locale as Locale} />
          </div>
          <WhatsAppFloat locale={locale as Locale} />
          <ConversionTracker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
