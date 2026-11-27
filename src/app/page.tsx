import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'Kanbi, AI task boards for freelancers',
  description: 'Paste notes, emails, or PDFs. Kanbi extracts tasks onto a Kanban board with workload health and autopilot planning.',
  openGraph: {
    title: 'Kanbi, AI task boards for freelancers',
    description: 'Paste notes, emails, or PDFs. Kanbi extracts tasks onto a Kanban board with workload health and autopilot planning.',
    url: 'https://kanbi.app',
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
        alt: 'Kanbi - a Kanban board filled with extracted tasks. Try Kanbi free, no card needed.',
      },
    ],
  },
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Already logged in <Icons.ArrowRight size={13}/> skip landing page, go straight to dashboard
  if (user) redirect('/dashboard');

  return <LandingPage />;
}
