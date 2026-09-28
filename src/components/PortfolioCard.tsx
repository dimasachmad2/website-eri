import type { PortfolioClient, PortfolioUI } from '@/content/site';

function Pin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-none opacity-70">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

/** Chip satu dokumen: selesai (isi) atau berjalan (garis putus). */
export function DocChip({ short, full, done }: { short: string; full: string; done: boolean }) {
  return (
    <span
      title={full}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
        done ? 'border border-line bg-tint text-ink' : 'border border-dashed border-amber-line text-muted'
      }`}
    >
      <span className={`h-[7px] w-[7px] flex-none rounded-full ${done ? 'bg-brand' : 'border-[1.5px] border-amber'}`} />
      {short}
    </span>
  );
}

/** Kartu satu klien — monogram, lokasi, status, dan daftar dokumen. */
export function PortfolioCard({ c, ui }: { c: PortfolioClient; ui: PortfolioUI }) {
  const statusText = c.status === 'done' ? ui.statusDone : c.status === 'prog' ? ui.statusProg : ui.statusMix;
  const statusClass = c.status === 'done'
    ? 'bg-badge text-brand-dark'
    : 'border border-amber-line bg-amber-soft text-amber';
  const dw = c.docs.length === 1 ? ui.docWord1 : ui.docWord;

  return (
    <article className="flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-[18px] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-18px_rgba(14,42,26,0.5)]">
      <div className="flex items-start gap-3">
        <div className="grid h-[46px] w-[46px] flex-none place-items-center rounded-xl border border-line bg-tint text-[15px] font-extrabold text-brand-dark">
          {c.mono}
        </div>
        <div className="min-w-0">
          <div className="text-base font-extrabold leading-tight">{c.client}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-muted">
            <Pin />
            {c.loc} · <span>{c.docs.length} {dw}</span>
          </div>
        </div>
        <span className={`ml-auto whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-extrabold ${statusClass}`}>
          {statusText}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {c.docs.map((d, i) => (
          <DocChip key={i} short={d.short} full={d.full} done={d.done} />
        ))}
      </div>
    </article>
  );
}
