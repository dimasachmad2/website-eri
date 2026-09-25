'use client';

import { useEffect, useRef, useState } from 'react';
import { WHATSAPP, type Locale } from '@/content/site';

const MSGS: Record<Locale, string[]> = {
  id: [
    'Halo! 👋 Selamat datang di PT Enviro Resources Indonesia.',
    'Butuh bantuan dokumen lingkungan, perizinan, atau pemantauan? Tim kami siap membantu.',
  ],
  en: [
    'Hello! 👋 Welcome to PT Enviro Resources Indonesia.',
    'Need help with environmental documents, permits or monitoring? Our team is ready to assist.',
  ],
};

export function WhatsAppFloat({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [count, setCount] = useState(0);
  const [time, setTime] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const msgs = MSGS[locale];
  const cta = locale === 'en' ? 'Start chat on WhatsApp' : 'Mulai chat di WhatsApp';

  useEffect(() => {
    setTime(new Date().toTimeString().slice(0, 5));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const toggle = () => {
    timers.current.forEach(clearTimeout);
    if (open) {
      setOpen(false);
      setTyping(false);
      setCount(0);
      return;
    }
    setOpen(true);
    setTyping(true);
    setCount(0);
    const T = (ms: number, fn: () => void) => setTimeout(fn, ms);
    timers.current = [
      T(900, () => { setTyping(false); setCount(1); }),
      T(1300, () => setTyping(true)),
      T(2300, () => { setTyping(false); setCount(2); }),
    ];
  };

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-4">
      {open && (
        <div
          className="w-80 max-w-[calc(100vw-48px)] origin-bottom-right overflow-hidden rounded-2xl bg-[#efe7dd] shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
          style={{ animation: 'waPop .28s cubic-bezier(.2,.9,.3,1.2) both' }}
        >
          <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3.5 text-white">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#075e54]">
              ERI
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold">PT Enviro Resources Indonesia</div>
              <div className="text-xs opacity-85">
                {typing ? (locale === 'en' ? 'typing…' : 'mengetik…') : 'online'}
              </div>
            </div>
            <button onClick={toggle} aria-label="Tutup" className="cursor-pointer border-0 bg-transparent p-1 text-2xl leading-none text-white">
              ×
            </button>
          </div>
          <div className="flex min-h-[120px] flex-col gap-2 px-4 py-5">
            {typing && (
              <div
                className="flex gap-1 self-start rounded-[0_10px_10px_10px] bg-white px-3.5 py-3"
                style={{ animation: 'waMsg .2s ease-out both' }}
              >
                {[0, 0.15, 0.3].map((d, i) => (
                  <span
                    key={i}
                    className="h-[7px] w-[7px] rounded-full bg-faint"
                    style={{ animation: `waDot 1.2s ${d}s infinite` }}
                  />
                ))}
              </div>
            )}
            {msgs.slice(0, count).map((m, i) => (
              <div
                key={i}
                className="max-w-[85%] self-start rounded-[0_10px_10px_10px] bg-white px-3 pb-1.5 pt-2 text-sm leading-snug text-[#111b21] shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
                style={{ animation: 'waMsg .3s ease-out both' }}
              >
                {m}
                <div className="mt-0.5 text-right text-[11px] text-[#8696a0]">{time}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-3">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 text-sm font-bold text-white hover:bg-[#1ebe5a] hover:text-white"
            >
              {cta}
            </a>
          </div>
        </div>
      )}

      <button
        onClick={toggle}
        aria-label="WhatsApp"
        className="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border-0 bg-[#25d366] shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:bg-[#1ebe5a]"
        style={{ animation: 'waPulse 2.4s infinite' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.3 11.3 0 0 0 12.05.72C5.8.72.7 5.8.7 12.07c0 2 .52 3.95 1.52 5.67L.6 23.64l6.04-1.58a11.3 11.3 0 0 0 5.4 1.38h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.03z" />
        </svg>
      </button>
    </div>
  );
}
