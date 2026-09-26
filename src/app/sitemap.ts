import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { ROUTES, SITE_URL } from '@/content/site';
import { getArticleSlugs } from '@/lib/articles';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of Object.values(ROUTES)) {
      const path = route === '/' ? '' : route;
      urls.push({
        url: `${SITE_URL}/${locale}${path}/`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: route === '/' ? 1 : 0.7,
      });
    }
    for (const slug of getArticleSlugs()) {
      urls.push({
        url: `${SITE_URL}/${locale}${ROUTES.articles}/${slug}/`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return urls;
}
