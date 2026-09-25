import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/Container';
import { Icon } from '@/components/Icon';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { getSite, type Locale } from '@/content/site';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t, aboutPhoto } = getSite(locale as Locale);
  const a = t.about;

  return (
    <>
      <PageHero locale={locale as Locale} page="about" />

      {/* Intro */}
      <Container className="grid grid-cols-1 items-center gap-14 pt-20 lg:grid-cols-2">
        <div className="h-[440px] overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aboutPhoto.img} alt="" className="h-full w-full object-cover" />
        </div>
        <div>
          <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">
            PT ENVIRO RESOURCES INDONESIA
          </div>
          <p className="m-0 mb-5 text-2xl font-semibold leading-relaxed">{a.intro}</p>
          <p className="m-0 text-base leading-relaxed text-muted">{a.approach}</p>
        </div>
      </Container>

      {/* Visi & Misi */}
      <Container className="grid grid-cols-1 gap-5 pt-24 lg:grid-cols-2">
        <div className="rounded-2xl bg-forest p-12 text-white">
          <div className="mb-5 text-sm font-bold uppercase tracking-wide text-soft">{a.visionL}</div>
          <p className="m-0 text-[28px] font-bold leading-snug">{a.vision}</p>
        </div>
        <div className="rounded-2xl bg-tint p-12">
          <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">{a.missionL}</div>
          {a.mission.map((m: { n: string; t: string }) => (
            <div key={m.n} className="flex gap-4 border-b border-[#d7e2da] py-4 last:border-b-0">
              <span className="w-7 flex-none font-extrabold text-brand">{m.n}</span>
              <span className="text-base leading-snug">{m.t}</span>
            </div>
          ))}
        </div>
      </Container>

      {/* Prinsip kerja */}
      <Container className="pt-24">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">{a.principlesL}</div>
        <h2 className="m-0 mb-10 text-3xl font-extrabold tracking-tight md:text-4xl">{a.principlesT}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {a.principles.map((p: { n: string; t: string; d: string }) => (
            <div key={p.n} className="rounded-xl border border-line p-7">
              <div className="mb-7 text-sm font-bold text-brand">{p.n}</div>
              <div className="mb-2 text-[19px] font-bold">{p.t}</div>
              <div className="text-sm leading-relaxed text-muted">{p.d}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* Nilai kerja */}
      <Container className="pt-24">
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-brand">
            <span className="h-0.5 w-7 bg-brand" />
            {a.valuesL}
          </div>
          <h2 className="m-0 max-w-[640px] text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            {a.valuesT}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {a.values.map((v: { n: string; t: string; d: string; iconPaths: string }) => (
            <div key={v.n} className="flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-7 transition-colors hover:bg-tint">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-badge text-brand">
                <Icon paths={v.iconPaths} className="h-6 w-6" />
              </div>
              <div className="mt-2 text-lg font-bold">{v.t}</div>
              <div className="text-sm leading-relaxed text-muted">{v.d}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* Kompetensi */}
      <Container className="pt-24">
        <div className="grid grid-cols-1 items-start gap-12 rounded-2xl bg-tint p-8 md:p-14 lg:grid-cols-[1fr_2fr]">
          <div>
            <div className="mb-3 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-brand">
              <span className="h-0.5 w-7 bg-brand" />
              {a.compL}
            </div>
            <h2 className="m-0 text-3xl font-extrabold leading-tight tracking-tight">{a.compT}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {a.comp.map((c: { t: string; d: string }) => (
              <div key={c.t} className="rounded-xl bg-white p-6">
                <div className="mb-2 text-[17px] font-bold">{c.t}</div>
                <div className="text-sm leading-relaxed text-muted">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <CtaBand locale={locale as Locale} />
    </>
  );
}
