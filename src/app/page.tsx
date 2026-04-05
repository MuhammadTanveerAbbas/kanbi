import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'Kanbi   AI Task Management for Freelancers',
  description: 'Paste notes, emails, or PDFs. Groq AI extracts every task in 2 seconds. Save 2+ hours daily.',
  openGraph: {
    title: 'Kanbi   AI Task Management for Freelancers',
    description: 'Paste notes, emails, or PDFs. Groq AI extracts every task in 2 seconds. Save 2+ hours daily.',
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
