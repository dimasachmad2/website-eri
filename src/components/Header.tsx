'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { Container } from './Container';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ROUTES, ABOUT_GROUP, type PageKey } from '@/content/site';

const TOP_LEVEL: PageKey[] = ['services', 'portfolio', 'articles', 'contact'];

export function Header({
  nav,
  cta,
  aboutOverview,
}: {
  nav: Record<PageKey, string>;
  cta: string;
  aboutOverview: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (key: PageKey) =>
    key === 'home' ? pathname === '/' : pathname === ROUTES[key];

  const linkClass = (active: boolean) =>
    `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-tint text-brand' : 'text-ink hover:bg-tint'
    }`;

  const aboutActive = ABOUT_GROUP.some(isActive);
  const aboutLabel = (k: PageKey) => (k === 'about' ? aboutOverview : nav[k]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-ink hover:text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="block h-9 w-auto" />
          <span className="flex flex-col gap-[3px] leading-none">
            <span className="whitespace-nowrap text-base font-extrabold tracking-tight">
              PT <span className="text-brand">ENVIRO RESOURCES</span>
            </span>
            <span className="text-[9.5px] font-bold tracking-[0.42em] text-ink">INDONESIA</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          <Link href="/" className={linkClass(isActive('home'))}>
            {nav.home}
          </Link>

          {/* About group */}
          <div className="group relative">
            <Link
              href={ROUTES.about}
              className={`flex items-center gap-1.5 ${linkClass(aboutActive)}`}
            >
              {nav.about}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M2 3.5l3 3 3-3" />
              </svg>
            </Link>
            <div className="invisible absolute left-0 top-full min-w-[230px] pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="flex flex-col gap-1 rounded-xl border border-line bg-white p-1.5 shadow-[0_16px_40px_rgba(14,42,26,0.14)]">
                {ABOUT_GROUP.map((k) => (
                  <Link key={k} href={ROUTES[k]} className={linkClass(isActive(k))}>
                    {aboutLabel(k)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {TOP_LEVEL.map((k) => (
            <Link key={k} href={ROUTES[k]} className={linkClass(isActive(k))}>
              {nav[k]}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href={ROUTES.contact}
            className="hidden rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-dark hover:text-white sm:block"
          >
            {cta}
          </Link>
          {/* Hamburger */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-line bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            <Link href="/" onClick={() => setMobileOpen(false)} className={linkClass(isActive('home'))}>
              {nav.home}
            </Link>
            {(['about', ...ABOUT_GROUP.filter((k) => k !== 'about')] as PageKey[]).map((k) => (
              <Link key={k} href={ROUTES[k]} onClick={() => setMobileOpen(false)} className={linkClass(isActive(k))}>
                {aboutLabel(k)}
              </Link>
            ))}
            {TOP_LEVEL.map((k) => (
              <Link key={k} href={ROUTES[k]} onClick={() => setMobileOpen(false)} className={linkClass(isActive(k))}>
                {nav[k]}
              </Link>
            ))}
            <Link
              href={ROUTES.contact}
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg bg-brand px-4 py-3 text-center text-sm font-bold text-white hover:text-white"
            >
              {cta}
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}
