'use client';

import { useEffect, useState } from 'react';
import { Icon } from '../Icon';

type Step = {
  n: string;
  t: string;
  d: string;
  iconPaths: string;
  photo: { img: string; credit: string; href: string };
};

export function MethodStepper({
  steps,
  eyebrow,
  title,
  note,
  stageWord,
}: {
  steps: Step[];
  eyebrow: string;
  title: string;
  note: string;
  stageWord: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % steps.length), 5000);
    return () => clearTimeout(id);
  }, [active, paused, steps.length]);

  const cur = steps[active];

  return (
    <section
      className="grid grid-cols-1 items-stretch gap-16 lg:grid-cols-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div>
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">{eyebrow}</div>
        <h2 className="m-0 mb-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
          {title}
        </h2>
        <p className="m-0 mb-8 max-w-[480px] text-[15px] leading-relaxed text-muted">{note}</p>

        <div className="border-t border-line">
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => setActive(i)}
                className="w-full cursor-pointer border-b border-line pt-[18px] text-left"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[10px] transition-colors ${
                      on ? 'bg-brand text-white' : 'bg-badge text-brand'
                    }`}
                  >
                    <Icon paths={s.iconPaths} className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span
                    className={`flex-1 text-lg font-bold transition-colors ${
                      on ? 'text-ink' : 'text-faint'
                    }`}
                  >
                    {s.t}
                  </span>
                  <span className="text-sm font-bold text-faint">{s.n}</span>
                </div>
                <div
                  className="grid transition-[grid-template-rows] duration-500 ease-out"
                  style={{ gridTemplateRows: on ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="m-0 pl-[58px] pt-2.5 text-[15px] leading-relaxed text-muted">{s.d}</p>
                  </div>
                </div>
                <div className="mt-[18px] h-0.5 overflow-hidden">
                  {on && (
                    <div
                      key={`${active}-${paused}`}
                      className="h-full bg-brand"
                      style={{
                        width: paused ? '100%' : '0%',
                        animation: paused ? 'none' : 'mBar 5s linear forwards',
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel gambar */}
      <div className="relative min-h-[420px] overflow-hidden rounded-2xl bg-forest lg:min-h-[560px]">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className="absolute inset-0 transition-[opacity,transform] duration-700"
            style={{ opacity: i === active ? 1 : 0, transform: i === active ? 'scale(1)' : 'scale(1.06)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.photo.img} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to top,rgba(14,42,26,.92) 0%,rgba(14,42,26,.3) 50%,rgba(14,42,26,0) 75%)',
          }}
        />
        <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-6 text-white">
          <div>
            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-soft">
              {stageWord}
              {cur.n}
            </div>
            <div className="max-w-[420px] text-2xl font-extrabold leading-tight md:text-3xl">
              {cur.t}
            </div>
          </div>
          <div className="whitespace-nowrap text-5xl font-extrabold leading-none">
            {cur.n}
            <span className="text-xl text-ondark"> / 05</span>
          </div>
        </div>
      </div>
    </section>
  );
}
