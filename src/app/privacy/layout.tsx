import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Privacy Policy · Kanbi',
  description: 'How Kanbi collects, uses, and protects your personal information.',
  alternates: { canonical: 'https://kanbi.app/privacy' },
}

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
