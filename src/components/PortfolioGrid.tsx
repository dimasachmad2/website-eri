'use client';

import { useState } from 'react';
import type { ProjectItem } from '@/content/site';

type Filter = { key: string; label: string };

export function PortfolioGrid({
  filters,
  projects,
}: {
  filters: Filter[];
  projects: ProjectItem[];
}) {
  const [active, setActive] = useState('all');
  const shown = active === 'all' ? projects : projects.filter((p) => p.cat === active);

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2">
        {filters.map((f) => {
          const on = active === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              className={`cursor-pointer rounded-full border px-[18px] py-2.5 text-sm font-bold transition-colors ${
                on ? 'border-forest bg-forest text-white' : 'border-line bg-white text-ink hover:border-brand'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <div key={p.key}>
            <div className="mb-4 h-[240px] overflow-hidden rounded-[10px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="mb-1.5 text-xs font-bold text-brand">{p.tag}</div>
            <div className="mb-1 text-lg font-bold">{p.t}</div>
            <div className="text-sm text-faint">{p.loc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
