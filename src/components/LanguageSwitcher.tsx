'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/content/site';

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as Locale;

  const set = (l: Locale) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (l !== locale) router.replace(pathname, { locale: l });
  };

  return (
    <div className="flex rounded-lg bg-tint p-[3px] text-xs font-bold">
      {(['id', 'en'] as const).map((l) => {
        const active = locale === l;
        return (
          <a
            key={l}
            href="#"
            onClick={set(l)}
            aria-current={active ? 'true' : undefined}
            className={`rounded-md px-2.5 py-1.5 uppercase transition-colors ${
              active ? 'bg-white text-ink' : 'text-faint hover:text-ink'
            }`}
          >
            {l}
          </a>
        );
      })}
    </div>
  );
}
