import { Metadata } from 'next';
import { SITE_URL } from '@/app/sitemap';
import LandingPage from '@/components/LandingPage';

const HOME_TITLE = 'Kanbi, AI task boards for freelancers';
const HOME_DESCRIPTION = 'Paste notes, emails, or PDFs. Kanbi extracts tasks onto a Kanban board with workload health and autopilot planning.';
const HOME_IMAGE_ALT = 'Kanbi - a Kanban board filled with extracted tasks. Try Kanbi free, no card needed.';

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    type: 'website',
    // Next.js merges metadata shallowly, so this page-level openGraph replaces
    // the one in the root layout. Repeat the shared fields here or they vanish.
    siteName: 'KANBI',
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: HOME_IMAGE_ALT,
      },
    ],
  },
  // The same applies to twitter. Keep every field here so the card keeps its
  // large image layout and attribution when this object replaces the root one.
  twitter: {
    card: 'summary_large_image',
    site: '@m_tanveerabbas',
    creator: '@m_tanveerabbas',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: '/twitter-image',
        alt: 'Kanbi - turn notes into a Kanban board. Try Kanbi free, no card needed.',
      },
    ],
  },
};

export default function Home() {
  return <LandingPage />;
}
