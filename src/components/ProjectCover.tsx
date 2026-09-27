import { Icon } from './Icon';
import type { ProjectItem } from '@/content/site';

// Ikon per kategori layanan.
const CAT_ICONS: Record<string, string> = {
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  tech: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5l1.8 1.8 3.2-3.6"/>',
  infra: '<path d="M3 21h18"/><path d="M5 21V10l5 3v-3l5 3V6l4 2v13"/>',
  waste: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
};

const BG = 'linear-gradient(135deg,#0e2a1a 0%,#153d27 55%,#1d5a32 100%)';
const DOTS = {
  backgroundImage: 'radial-gradient(rgba(143,220,147,.18) 1px,transparent 1px)',
  backgroundSize: '18px 18px',
};

/**
 * Sampul kartu portofolio, bertingkat:
 * foto lapangan → mockup dokumen di latar brand → kartu tipografis.
 * Parent harus punya class `group` (untuk efek hover).
 */
export function ProjectCover({ p }: { p: ProjectItem }) {
  // 1) Foto lapangan asli
  if (p.img) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.img}
        alt={p.t}
        style={{ objectPosition: p.pos ?? 'center' }}
        className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
      />
    );
  }

  const icon = CAT_ICONS[p.cat] ?? CAT_ICONS.doc;

  // 2) Dokumen sebagai objek di atas latar brand (1–2 lembar bertumpuk)
  if (p.docs?.length) {
    const [front, back] = p.docs;
    const sheet = 'h-full w-auto rounded-sm shadow-[0_24px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10';
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: BG }}>
        <div className="absolute inset-0" style={DOTS} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-bright/20 blur-3xl" />
        <div
          className={`relative h-[82%] -rotate-3 transition-all duration-500 ease-out group-hover:rotate-0 group-hover:scale-[1.04] ${
            back ? '-translate-x-4' : ''
          }`}
        >
          {back ? (
            /* lembar kedua di belakang, membuka seperti kipas saat hover */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={back}
              alt=""
              className={`absolute left-0 top-0 translate-x-7 translate-y-1 rotate-6 transition-all duration-500 ease-out group-hover:translate-x-14 group-hover:rotate-12 ${sheet}`}
            />
          ) : (
            <div className="absolute inset-0 translate-x-3 translate-y-1 rotate-6 rounded-sm bg-white/15" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={front} alt={p.t} className={`relative ${sheet}`} />
        </div>
      </div>
    );
  }

  // 3) Kartu tipografis (tanpa gambar)
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: BG }}>
      <div className="absolute inset-0" style={DOTS} />
      <div className="absolute -bottom-10 -right-10 text-white/[0.07] transition-transform duration-700 ease-out group-hover:scale-110">
        <Icon paths={icon} className="h-56 w-56" strokeWidth={1.2} />
      </div>
      <div className="relative flex h-full flex-col justify-between p-6 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-soft">
          <Icon paths={icon} className="h-5 w-5" />
        </span>
        <div>
          <div className="text-3xl font-extrabold leading-tight tracking-tight">{p.tag}</div>
          {p.client && <div className="mt-1 text-sm text-ondark">{p.client}</div>}
        </div>
      </div>
    </div>
  );
}
