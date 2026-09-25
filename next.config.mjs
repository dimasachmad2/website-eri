import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// BUILD_STATIC=1 → export statis (untuk deploy ke Hostinger shared via FTP, Fase 1).
// Default → standalone (untuk Hostinger Managed Node.js, dipakai lagi di Fase 2 saat butuh server).
const isStatic = process.env.BUILD_STATIC === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isStatic ? 'export' : 'standalone',
  // Folder-per-rute (mis. /id/about/index.html) supaya rapi di server statis apa pun.
  trailingSlash: isStatic,
  images: {
    unoptimized: isStatic,
    // Domain aset Directus ditambahkan di Fase 2, contoh:
    // remotePatterns: [{ protocol: 'https', hostname: 'cms.envirors.id' }],
  },
};

export default withNextIntl(nextConfig);
