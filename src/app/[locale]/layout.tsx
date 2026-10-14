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
import { getSite, SITE_URL, COMPANY, GTM_ID, type Locale } from '@/content/site';
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
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header nav={nav} cta={t.cta} aboutOverview={aboutOverview} />
            <main className="flex-1">{children}</main>
            <Footer locale={locale as Locale} />
          </div>
          <WhatsAppFloat locale={locale as Locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
