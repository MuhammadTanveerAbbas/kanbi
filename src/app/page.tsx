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
  },
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Already logged in → skip landing page, go straight to dashboard
  if (user) redirect('/dashboard');

  return <LandingPage />;
}
