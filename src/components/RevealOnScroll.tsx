'use client';

import { useEffect } from 'react';

// Animasi muncul saat scroll untuk elemen ber-atribut data-reveal / data-reveal-zoom /
// data-reveal-line (gaya di globals.css). Hanya elemen yang masih di bawah layar yang
// disembunyikan dulu, jadi tidak ada kedipan dan konten tetap terbaca tanpa JS.
export function RevealOnScroll() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.remove('rv-hide');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    const els = document.querySelectorAll<HTMLElement>('[data-reveal],[data-reveal-zoom],[data-reveal-line]');
    for (const el of els) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) continue;
      el.classList.add('rv-hide');
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return null;
}
