import { MetadataRoute } from 'next';
import { SITE_URL } from '@/app/sitemap';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The API surface and the authenticated dashboard must not be indexed.
      disallow: ['/api/', '/dashboard', '/auth/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
