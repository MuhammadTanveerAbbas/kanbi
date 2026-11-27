import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { SITE_URL } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Privacy Policy · Kanbi',
  description: 'How Kanbi collects, uses, and protects your personal information.',
  alternates: { canonical: `${SITE_URL}/privacy` },
}

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
