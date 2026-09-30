import type { Metadata } from 'next'
import ChangelogPage from '@/components/ChangelogPage'
import { SITE_URL } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Changelog - Kanbi',
  description:
    'Every user visible change to Kanbi, newest first, including fixes, security improvements, and removals.',
  alternates: { canonical: `${SITE_URL}/changelog` },
  robots: { index: true, follow: true },
}

export default function Page() {
  return <ChangelogPage />
}
