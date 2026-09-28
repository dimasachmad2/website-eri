'use client';

import { useState } from 'react';
import type { PortfolioClient, PortfolioUI } from '@/content/site';
import { PortfolioCard, DocChip } from './PortfolioCard';

type Stats = { clients: number; docs: number; cities: number; closed: number };
type Filter = 'all' | 'done' | 'prog';

/** Daftar (ledger) dikelompokkan Selesai / Sedang berjalan. */
function ListView({ clients, ui }: { clients: PortfolioClient[]; ui: PortfolioUI }) {
  const groups = [['done', ui.groupDone], ['prog', ui.groupProg]] as const;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {groups.map(([g, title]) => {
        const rows = clients
          .map((c) => {
            const docs = c.docs.filter((d) => (g === 'done' ? d.done : !d.done));
            if (!docs.length) return null;
            return (
              <div key={c.n} className="grid grid-cols-1 items-start gap-2 border-b border-line px-4 py-4 sm:grid-cols-[1fr_auto] sm:gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line bg-tint text-[13px] font-extrabold text-brand-dark">
                    {c.mono}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-extrabold leading-tight">{c.client}</div>
                    <div className="mt-0.5 text-xs font-semibold text-muted">{c.loc}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {docs.map((d, i) => (
                    <DocChip key={i} short={d.short} full={d.full} done={d.done} />
                  ))}
                </div>
              </div>
            );
          })
          .filter(Boolean);
        if (!rows.length) return null;
        return (
          <div key={g}>
            <div className="border-b border-line bg-tint px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted">
              {title}
            </div>
            {rows}
          </div>
        );
      })}
    </div>
  );
}

export function PortfolioBoard({ clients, stats, ui }: { clients: PortfolioClient[]; stats: Stats; ui: PortfolioUI }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<'card' | 'list'>('card');

  const shown = clients.filter((c) =>
    filter === 'all' ? true : filter === 'done' ? c.docs.some((d) => d.done) : c.docs.some((d) => !d.done),
  );

  const tiles: [number, string][] = [
    [stats.clients, ui.stats.clients],
    [stats.docs, ui.stats.docs],
    [stats.cities, ui.stats.cities],
    [stats.closed, ui.stats.closed],
  ];
  const filters: [Filter, string][] = [['all', ui.all], ['done', ui.done], ['prog', ui.prog]];
  const views: ['card' | 'list', string][] = [['card', ui.viewCard], ['list', ui.viewList]];

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([n, l], i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-4">
            <div className="text-[26px] font-extrabold leading-none tracking-tight tabular-nums">{n}</div>
            <div className="mt-1.5 text-[12.5px] font-semibold text-muted">{l}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          {filters.map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                filter === k ? 'bg-brand text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="inline-flex gap-0.5 rounded-[10px] border border-line bg-white p-0.5">
          {views.map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition-colors ${
                view === k ? 'bg-tint text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-4 text-xs font-semibold text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand" />{ui.legendDone}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-amber" />{ui.legendProg}</span>
      </div>

      {view === 'card' ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {shown.map((c) => (
            <PortfolioCard key={c.n} c={c} ui={ui} />
          ))}
        </div>
      ) : (
        <ListView clients={shown} ui={ui} />
      )}
    </div>
  );
}
