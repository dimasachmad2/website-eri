import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger Managed Node.js menjalankan output standalone.
  output: 'standalone',
  images: {
    // Domain aset Directus ditambahkan di Fase 2, contoh:
    // remotePatterns: [{ protocol: 'https', hostname: 'cms.envirors.id' }],
  },
};

export default withNextIntl(nextConfig);
