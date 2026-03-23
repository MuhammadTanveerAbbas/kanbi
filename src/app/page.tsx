import { Metadata } from 'next';
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

export default function Home() {
  return <LandingPage />;
}
