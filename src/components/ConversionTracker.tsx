'use client';

import { useEffect } from 'react';

// Event dataLayer untuk GTM → konversi Google Ads / GA4.
// Nama event: wa_click, phone_click, email_click, compro_download, contact_form_submit.
type TrackEvent = 'wa_click' | 'phone_click' | 'email_click' | 'compro_download' | 'contact_form_submit';

export function track(event: TrackEvent, params: Record<string, string> = {}) {
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...params });
}

// Posisi tombol: atribut data-cta terdekat, atau header/footer, selain itu "body".
function ctaLocation(el: Element): string {
  const tagged = el.closest<HTMLElement>('[data-cta]');
  if (tagged?.dataset.cta) return tagged.dataset.cta;
  if (el.closest('header')) return 'header';
  if (el.closest('footer')) return 'footer';
  return 'body';
}

function classify(href: string): TrackEvent | null {
  if (href.startsWith('https://wa.me/') || href.includes('api.whatsapp.com')) return 'wa_click';
  if (href.startsWith('tel:')) return 'phone_click';
  if (href.startsWith('mailto:')) return 'email_click';
  if (href.includes('company-profile') && href.endsWith('.pdf')) return 'compro_download';
  return null;
}

// Satu listener global (delegasi) → semua tautan WA/telepon/email/compro di situs
// otomatis terlacak tanpa mengubah tiap komponen.
export function ConversionTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const event = classify(href);
      if (event) track(event, { cta_location: ctaLocation(a), link_url: href });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}
