'use client';

import { useState } from 'react';
import { WHATSAPP } from '@/content/site';

type Labels = {
  name: string;
  company: string;
  phone: string;
  service: string;
  other: string;
  msg: string;
  send: string;
};

export function ContactForm({
  formT,
  formSub,
  thanksT,
  thanks,
  labels,
  services,
}: {
  formT: string;
  formSub: string;
  thanksT: string;
  thanks: string;
  labels: Labels;
  services: string[];
}) {
  const [sent, setSent] = useState(false);

  const field = 'rounded-lg border border-[#cfdad2] bg-white p-3.5 text-[15px] outline-none focus:border-brand';
  const label = 'flex flex-col gap-1.5 text-[13px] font-bold';

  // Kirim isi form ke WhatsApp ERI (tanpa backend).
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = [
      `Halo ERI, saya ingin konsultasi:`,
      ``,
      `Nama: ${fd.get('name') || '-'}`,
      `Perusahaan/Instansi: ${fd.get('company') || '-'}`,
      `Email: ${fd.get('email') || '-'}`,
      `Telepon: ${fd.get('phone') || '-'}`,
      `Layanan: ${fd.get('service') || '-'}`,
      ``,
      `${fd.get('message') || ''}`,
    ].join('\n');
    window.open(`${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setSent(true);
  };

  if (sent) {
    return (
      <div className="py-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl text-white">
          ✓
        </div>
        <h2 className="m-0 mb-2.5 text-[28px] font-extrabold">{thanksT}</h2>
        <p className="m-0 text-base leading-relaxed text-muted">{thanks}</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="m-0 mb-2 text-[28px] font-extrabold tracking-tight">{formT}</h2>
      <p className="m-0 mb-7 text-[15px] leading-relaxed text-muted">{formSub}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={label}>
            {labels.name}
            <input name="name" required className={field} />
          </label>
          <label className={label}>
            {labels.company}
            <input name="company" className={field} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={label}>
            Email
            <input name="email" type="email" required className={field} />
          </label>
          <label className={label}>
            {labels.phone}
            <input name="phone" className={field} />
          </label>
        </div>
        <label className={label}>
          {labels.service}
          <select name="service" className={field}>
            {services.map((s) => (
              <option key={s}>{s}</option>
            ))}
            <option>{labels.other}</option>
          </select>
        </label>
        <label className={label}>
          {labels.msg}
          <textarea name="message" rows={5} className={`${field} resize-y`} />
        </label>
        <button
          type="submit"
          className="cursor-pointer self-start rounded-lg border-0 bg-brand px-6 py-4 text-[15px] font-bold text-white hover:bg-brand-dark"
        >
          {labels.send}
        </button>
      </form>
    </>
  );
}
