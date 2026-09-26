'use client';

import { useState } from 'react';
import { WHATSAPP } from '@/content/site';

type Item = { q: string; a: string };

export function Faq({
  title,
  sub,
  cta,
  list,
}: {
  title: string;
  sub: string;
  cta: string;
  list: Item[];
}) {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-12">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-brand">
          FAQ
        </div>
        <h2 className="m-0 mb-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
          {title}
        </h2>
        <p className="m-0 max-w-[560px] text-[15px] leading-relaxed text-muted">{sub}</p>
      </div>

      <div className="flex flex-col gap-2">
        {list.map((f, i) => {
          const on = open === i;
          const n = String(i + 1).padStart(2, '0');
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-xl border transition-colors ${
                on ? 'border-line bg-tint' : 'border-line bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(on ? -1 : i)}
                className="flex w-full cursor-pointer items-center gap-6 border-0 bg-transparent px-7 py-6 text-left"
                aria-expanded={on}
              >
                <span className={`w-11 flex-none text-sm font-extrabold ${on ? 'text-brand' : 'text-faint'}`}>
                  {n}
                </span>
                <span className="flex-1 text-lg font-bold leading-snug text-ink">{f.q}</span>
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full transition-transform"
                  style={{ transform: on ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke={on ? '#23862a' : '#56675c'} strokeWidth="2.2" strokeLinecap="round">
                    <path d="M7 1v12M1 7h12" />
                  </svg>
                </span>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-[450ms] ease-out"
                style={{ gridTemplateRows: on ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="m-0 px-7 pb-7 pl-24 text-[15px] leading-relaxed text-muted">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <a
          href={WHATSAPP}
          className="rounded-lg bg-brand px-6 py-4 font-bold text-white hover:bg-brand-dark hover:text-white"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
