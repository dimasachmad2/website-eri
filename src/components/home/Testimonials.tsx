type Q = { text: string; name: string; role: string };

export function Testimonials({
  eyebrow,
  title,
  list,
}: {
  eyebrow: string;
  title: string;
  list: Q[];
}) {
  const loop = [...list, ...list];

  return (
    <section className="mt-28 bg-tint">
      <div className="mx-auto max-w-[1280px] px-6 pt-24 md:px-8">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-brand">
              {eyebrow}
            </div>
            <h2 className="m-0 text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
          </div>
        </div>
      </div>

      <div className="overflow-hidden pb-24 [mask-image:linear-gradient(90deg,transparent_0,#000_6%,#000_94%,transparent_100%)]">
        <div className="flex w-max gap-5 pr-5" style={{ animation: 'tMarquee 60s linear infinite' }}>
          {loop.map((q, i) => {
            const dark = i % 3 === 0;
            return (
              <figure
                key={i}
                className={`m-0 flex w-[380px] flex-none flex-col gap-7 rounded-2xl border p-8 ${
                  dark ? 'border-white/15 bg-forest text-white' : 'border-line bg-white text-ink'
                }`}
              >
                <svg width="36" height="28" viewBox="0 0 36 28" fill="#4fc255" aria-hidden="true">
                  <path d="M0 28V16C0 7 5 1.5 14 0l1.5 4C10 5.5 7.5 9 7.5 13H14v15H0zm21 0V16c0-9 5-14.5 14-16l1 4c-5.5 1.5-8 5-8 9h6.5v15H21z" />
                </svg>
                <blockquote className="m-0 flex-1 text-[17px] font-medium leading-relaxed">
                  {q.text}
                </blockquote>
                <figcaption className={`flex items-center gap-3.5 border-t pt-6 ${dark ? 'border-white/15' : 'border-line'}`}>
                  <div className="h-12 w-12 flex-none rounded-full bg-black/10" />
                  <div>
                    <div className="text-[15px] font-bold">{q.name}</div>
                    <div className={`mt-0.5 text-[13px] ${dark ? 'text-ondark' : 'text-faint'}`}>{q.role}</div>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
