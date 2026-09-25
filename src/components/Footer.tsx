import { Link } from '@/i18n/navigation';
import { Container } from './Container';
import { getSite, ROUTES, WHATSAPP, PHONE_DISPLAY, type Locale } from '@/content/site';

export function Footer({ locale }: { locale: Locale }) {
  const { t, nav } = getSite(locale);

  return (
    <footer className="mt-28 bg-forest text-ondark">
      <Container className="pb-8 pt-16">
        <div className="grid grid-cols-1 gap-10 border-b border-dark2 pb-10 text-sm leading-loose sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-2 text-base font-extrabold text-white">
              PT Enviro Resources Indonesia
            </div>
            Citraland CBD S6/01, Driyorejo,
            <br />
            Gresik, Jawa Timur
          </div>

          <div>
            <div className="mb-2 font-bold text-white">{t.footer.company}</div>
            <div className="flex flex-col">
              <Link href={ROUTES.about} className="text-ondark hover:text-white">{nav.about}</Link>
              <Link href={ROUTES.team} className="text-ondark hover:text-white">{nav.team}</Link>
              <Link href={ROUTES.legal} className="text-ondark hover:text-white">{nav.legal}</Link>
              <Link href={ROUTES.articles} className="text-ondark hover:text-white">{nav.articles}</Link>
            </div>
          </div>

          <div>
            <div className="mb-2 font-bold text-white">{nav.services}</div>
            <div className="flex flex-col">
              {(t.footer.svc as string[]).map((s) => (
                <Link key={s} href={ROUTES.services} className="text-ondark hover:text-white">
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-bold text-white">{nav.contact}</div>
            <div className="flex flex-col">
              <a href={WHATSAPP} className="text-ondark hover:text-white">{PHONE_DISPLAY}</a>
              <a href="mailto:info@envirors.id" className="text-ondark hover:text-white">info@envirors.id</a>
              <a href="mailto:admin@envirors.id" className="text-ondark hover:text-white">admin@envirors.id</a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 pt-6 text-[13px]">
          <span>© 2026 PT Enviro Resources Indonesia</span>
          <span>Solutions for a Greener Tomorrow</span>
        </div>
      </Container>
    </footer>
  );
}
