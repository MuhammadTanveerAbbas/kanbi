import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { SITE_URL } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Terms of Service · Kanbi',
  description: 'Terms and conditions governing your use of Kanbi.',
  alternates: { canonical: `${SITE_URL}/terms` },
}

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
