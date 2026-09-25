# Website PT Enviro Resources Indonesia

Company profile + insights (artikel) untuk PT Enviro Resources Indonesia — konsultan
lingkungan (AMDAL/UKL-UPL, persetujuan teknis, prasarana pengolahan limbah, dsb).
Bilingual **ID/EN**. Arah desain: **1b Korporat**.

## Arsitektur

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│  Hostinger BUSINESS plan     │      │  AWS Lightsail (VPS, Docker)  │
│  Managed Node.js             │      │                               │
│                              │◄─────┤  n8n        (otomasi)         │
│  Next.js — situs compro      │ baca │  Directus   (CMS + API)       │
│  • App Router, i18n ID/EN    │ API  │  Postgres   (database)        │
│  • SSG/ISR + on-demand       │      │                               │
│    revalidate                │─────►│  revalidate webhook           │
│  • auto-deploy dari GitHub   │      │                               │
└─────────────────────────────┘      └───────────────┬──────────────┘
                                                      │ Claude API (artikel)
                                                      │ Telegram Bot (submit)
```

- **Frontend:** Next.js (App Router, TypeScript, Tailwind v4, next-intl) — di Hostinger Business (Managed Node.js, `output: 'standalone'`).
- **CMS:** Directus (Docker + Postgres) di Lightsail — menyimpan artikel, tim, proyek, layanan, sertifikasi, halaman. Admin UI + REST/GraphQL.
- **Otomasi:** n8n (Docker) di Lightsail — Telegram → Claude API (draft artikel) → approval → tulis ke Directus → revalidate Next.js.

## Stack

| Lapisan   | Teknologi                                  |
| --------- | ------------------------------------------ |
| Framework | Next.js 15 (App Router) + React 19         |
| Bahasa    | TypeScript                                 |
| Styling   | Tailwind CSS v4 (token di `globals.css`)   |
| i18n      | next-intl (rute `/id`, `/en`)              |
| Node      | 22 (Hostinger butuh ≥ 20)                  |

## Struktur folder

```
src/
  app/[locale]/        # halaman per-locale (id/en)
    layout.tsx         # <html>, font, provider i18n
    page.tsx           # Beranda (placeholder Fase 0)
    globals.css        # @theme design token 1b Korporat
  i18n/                # konfigurasi next-intl (routing, request, navigation)
  components/          # komponen UI (diisi Fase 1)
  lib/                 # helper & klien Directus (diisi Fase 2)
  middleware.ts        # deteksi & redirect locale
messages/              # teks UI: id.json, en.json
public/                # aset statis (logo, company profile)
design-reference/      # mockup asli (.dc.html) — acuan desain, tidak di-build
assets/                # aset sumber (foto, logo) dari fase desain
```

## Development

```bash
npm install
npm run dev      # http://localhost:3000  → redirect ke /id
npm run build    # verifikasi build standalone
```

## Deploy ke Hostinger (Managed Node.js)

1. Push repo ini ke GitHub.
2. hPanel → **Websites → Node.js app** → hubungkan repo GitHub (auto-build tiap push).
3. Build command `npm run build`, start otomatis dari output `standalone`. Node ≥ 20.
4. Set environment variable dari `.env.example` (lihat di bawah).
5. Arahkan domain `envirors.id`.

Env yang dipakai: lihat [`.env.example`](.env.example). `DIRECTUS_*` & `REVALIDATE_SECRET`
baru diperlukan mulai Fase 2.

## Roadmap

- [x] **Fase 0 — Fondasi:** scaffold Next.js, design token 1b, i18n, rencana deploy.
- [x] **Fase 1 — Situs:** port 8 halaman dari mockup (data statis dari `src/content/site.ts`).
- [ ] **Fase 1b — Deploy:** hubungkan repo ke Hostinger Managed Node.js, tayangkan.
- [ ] **Fase 2 — Directus:** CMS + Postgres di Lightsail, artikel/konten editable, revalidate.
- [ ] **Fase 3 — Otomasi:** n8n + Claude, submit artikel via Telegram (dengan approval).
- [ ] **Fase 4 — Polish:** SEO/JSON-LD, analytics, backup terjadwal, monitoring.
