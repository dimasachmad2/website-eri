# Deploy ke Hostinger (Managed Node.js)

Situs ini Next.js (App Router, `output: 'standalone'`). Hostinger Business plan
mendukungnya lewat **Managed Node.js** dengan auto-build dari GitHub.

## Yang harus diisi di hPanel

| Field                | Nilai        |
| -------------------- | ------------ |
| Application type     | `next`       |
| Build script         | `build`      |
| Output directory     | `.next`      |
| Entry file           | (diabaikan untuk Next.js) |
| Node version         | 20 atau lebih (repo pin 22 via `.nvmrc`) |

Tidak ada environment variable yang wajib untuk versi saat ini (Fase 1).
`DIRECTUS_*` & `REVALIDATE_SECRET` baru diperlukan mulai Fase 2 — lihat `.env.example`.

## Langkah

1. **hPanel → Websites → Add Website → Deploy Web App.**
2. **Import Git Repository** → **Authorize** Hostinger di GitHub (repo `website-eri`
   privat, jadi wajib authorize; paste-URL publik tidak berlaku).
3. Pilih repo **`dimasachmad2/website-eri`**, branch `main`.
4. Framework terdeteksi **Next.js**. Pastikan: type `next`, build `build`, output `.next`.
5. Klik **Deploy**. Build pertama ~beberapa menit; muncul screenshot preview bila sukses.
6. Uji `…/id` dan `…/en`, cek toggle bahasa, WhatsApp float, menu mobile.
7. **Domain:** kalau `envirors.id` sudah dimiliki, hubungkan di pengaturan situs
   (Add domain / arahkan DNS). Kalau belum, pakai subdomain sementara dari Hostinger dulu.

## Auto-deploy

Setelah terhubung, setiap `git push` ke `main` memicu build ulang otomatis di Hostinger.

## Catatan

- Config Next **harus** mengekspor objek (bukan function) — sudah dipastikan
  (`next.config.mjs` → objek, `output: standalone`).
- ISR & on-demand revalidation jalan otomatis (dipakai nanti di Fase 2).
- Kalau build gagal, salin **log build Hostinger** dan kirim untuk didiagnosis.
