import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { ContactForm } from '@/components/ContactForm';
import { getSite, WHATSAPP, PHONE_DISPLAY, metaFor, type Locale } from '@/content/site';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return metaFor(locale as Locale, 'contact');
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t, allServices } = getSite(locale as Locale);
  const c = t.contact;

  return (
    <>
      <PageHero locale={locale as Locale} page="contact" />
      <Container className="grid grid-cols-1 gap-14 pt-20 lg:grid-cols-2">
        {/* Info */}
        <div>
          <div className="flex flex-col gap-7">
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-brand">{c.officeL}</div>
              <div className="text-lg font-semibold leading-snug">
                Citraland CBD S6/01, Driyorejo,
                <br />
                Gresik, Jawa Timur
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-brand">{c.phoneL}</div>
              <a href={WHATSAPP} className="text-2xl font-extrabold text-ink hover:text-brand">
                {PHONE_DISPLAY}
              </a>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-brand">EMAIL</div>
              <div className="flex flex-col gap-1 text-lg font-semibold">
                <a href="mailto:info@enviroresources.co.id" className="text-ink hover:text-brand">info@enviroresources.co.id</a>
              </div>
            </div>
          </div>
          <div className="mt-10 flex h-[280px] items-end rounded-xl bg-tint p-4 text-xs text-faint">
            {locale === 'en'
              ? 'Google Maps embed: Citraland CBD, Driyorejo'
              : 'Embed Google Maps: Citraland CBD, Driyorejo'}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-tint p-8 md:p-10">
          <ContactForm
            formT={c.formT}
            formSub={c.formSub}
            thanksT={c.thanksT}
            thanks={c.thanks}
            labels={c.f}
            services={allServices.map((s) => s.t)}
          />
        </div>
      </Container>
    </>
  );
}
