import { MetadataRoute } from 'next';

/**
 * The canonical origin. Kept in one place so the sitemap, robots file, and
 * metadata cannot disagree, and read from the environment so a deployment does
 * not have to be edited to match its own domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://kanbi-actionboard.vercel.app'
).replace(/\/$/, '');

/**
 * Only publicly indexable pages are listed. The dashboard is behind
 * authentication, and the /dashboard/* paths are client side redirects, so
 * neither belongs in a sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/changelog`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
