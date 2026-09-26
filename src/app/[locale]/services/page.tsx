import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { getSite, metaFor, type Locale } from '@/content/site';

const PILLS = ['AMDAL', 'UKL-UPL', 'SPPL', 'DELH', 'DPLH'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return metaFor(locale as Locale, 'services');
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t } = getSite(locale as Locale);
  const { svc, fw, infra, nonb3, method } = t;

  return (
    <>
      <PageHero locale={locale as Locale} page="services" />

      {/* Dokumen & persetujuan */}
      <Container className="pt-20">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">{svc.docL}</div>
        <h2 className="m-0 mb-3 text-3xl font-extrabold tracking-tight md:text-4xl">{svc.docT}</h2>
        <p className="m-0 mb-9 max-w-[720px] text-base leading-relaxed text-muted">{svc.docNote}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {svc.docs.map((d: { n: string; t: string }) => (
            <div key={d.n} className="flex items-baseline gap-5 rounded-xl border border-line p-7">
              <span className="text-sm font-extrabold text-brand">{d.n}</span>
              <span className="text-lg font-bold leading-snug">{d.t}</span>
            </div>
          ))}
        </div>
      </Container>

      {/* Teknis, operasi & pelaporan */}
      <Container className="pt-24">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">{svc.techL}</div>
        <h2 className="m-0 mb-9 text-3xl font-extrabold tracking-tight md:text-4xl">{svc.techT}</h2>
        <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {svc.tech.map((d: { t: string; d: string }) => (
            <div key={d.t} className="border-t border-line py-6">
              <div className="mb-1.5 text-lg font-bold">{d.t}</div>
              <div className="text-sm leading-relaxed text-muted">{d.d}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* Kerangka perizinan */}
      <Container className="pt-24">
        <div className="rounded-2xl bg-forest p-8 text-white md:p-14">
          <div className="mb-3 text-sm font-bold uppercase tracking-wide text-soft">{fw.eyebrow}</div>
          <h2 className="m-0 mb-3 text-2xl font-extrabold tracking-tight md:text-3xl">{fw.title}</h2>
          <p className="m-0 mb-10 max-w-[720px] text-base leading-relaxed text-ondark">{fw.sub}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[10px] border border-dark2 p-6">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-soft">{fw.baseL}</div>
              <div className="mb-1.5 text-[19px] font-bold">PP 22 Tahun 2021</div>
              <div className="mb-[18px] text-[13px] leading-relaxed text-ondark">{fw.pp}</div>
              <div className="mb-1.5 text-[19px] font-bold">Permen LHK 4 Tahun 2021</div>
              <div className="text-[13px] leading-relaxed text-ondark">{fw.permen}</div>
            </div>
            <div className="rounded-[10px] border border-dark2 p-6">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-soft">{fw.objL}</div>
              {(fw.obj as string[]).map((o) => (
                <div key={o} className="border-b border-dark2 py-2.5 text-[15px] last:border-b-0">{o}</div>
              ))}
            </div>
            <div className="rounded-[10px] border border-dark2 p-6">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-soft">{fw.resL}</div>
              <div className="flex flex-wrap gap-2">
                {PILLS.map((p) => (
                  <span key={p} className="rounded-full border border-brand-bright px-3.5 py-2 text-sm font-semibold">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="m-0 mt-8 border-t border-dark2 pt-6 text-sm leading-relaxed text-ondark">
            <b className="text-white">{fw.prinL}</b>: {fw.prin}
          </p>
        </div>
      </Container>

      {/* Infra & non-B3 */}
      <Container className="grid grid-cols-1 gap-5 pt-24 lg:grid-cols-2">
        <div className="rounded-2xl border border-line p-10">
          <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">KBLI 42203</div>
          <h3 className="m-0 mb-3.5 text-2xl font-extrabold tracking-tight">{infra.title}</h3>
          <p className="m-0 mb-6 text-[15px] leading-relaxed text-muted">{infra.scope}</p>
          <div className="mb-2 text-[13px] font-bold">{infra.focusL}</div>
          {(infra.focus as string[]).map((f) => (
            <div key={f} className="flex gap-3 border-b border-tint py-2.5 text-[15px]">
              <span className="font-extrabold text-brand">✓</span>
              {f}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-line p-10">
          <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">KBLI 38110 · 38219</div>
          <h3 className="m-0 mb-6 text-2xl font-extrabold tracking-tight">{nonb3.title}</h3>
          {nonb3.items.map((i: { t: string; d: string }) => (
            <div key={i.t} className="border-t border-line py-5">
              <div className="mb-2 text-[17px] font-bold">{i.t}</div>
              <div className="text-[15px] leading-relaxed text-muted">{i.d}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* Metode (statis) */}
      <Container className="pt-24">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">{method.eyebrow}</div>
        <h2 className="m-0 mb-10 text-3xl font-extrabold tracking-tight md:text-4xl">{method.title}</h2>
        <div className="grid grid-cols-1 border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-5">
          {method.steps.map((s: { n: string; t: string; d: string }) => (
            <div key={s.n} className="pr-6 pt-6">
              <div className="mb-3.5 text-4xl font-extrabold text-brand">{s.n}</div>
              <div className="mb-2 text-[17px] font-bold">{s.t}</div>
              <div className="text-sm leading-relaxed text-muted">{s.d}</div>
            </div>
          ))}
        </div>
      </Container>

      <CtaBand locale={locale as Locale} />
    </>
  );
}
