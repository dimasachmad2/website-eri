import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { ContactForm } from '@/components/ContactForm';
import {
  getSite, WHATSAPP, PHONE_DISPLAY, LANDLINE_DISPLAY, LANDLINE_TEL,
  ADDRESS_LINE1, ADDRESS_LINE2, EMAIL, MAPS_QUERY, metaFor, type Locale,
} from '@/content/site';

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
                {ADDRESS_LINE1}
                <br />
                {ADDRESS_LINE2}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-brand">{c.phoneL}</div>
              <a href={LANDLINE_TEL} className="text-2xl font-extrabold text-ink hover:text-brand">
                {LANDLINE_DISPLAY}
              </a>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-brand">{c.waL}</div>
              <a href={WHATSAPP} className="text-2xl font-extrabold text-ink hover:text-brand">
                {PHONE_DISPLAY}
              </a>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-brand">EMAIL</div>
              <div className="flex flex-col gap-1 text-lg font-semibold">
                <a href={`mailto:${EMAIL}`} className="text-ink hover:text-brand">{EMAIL}</a>
              </div>
            </div>
          </div>
          <div className="mt-10 h-[280px] overflow-hidden rounded-xl border border-line">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&z=16&output=embed`}
              title="Lokasi kantor PT Enviro Resources Indonesia"
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
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
