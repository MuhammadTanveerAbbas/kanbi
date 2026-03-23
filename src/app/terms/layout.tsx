import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Terms of Service · Kanbi',
  description: 'Terms and conditions governing your use of Kanbi.',
  alternates: { canonical: 'https://kanbi.app/terms' },
}

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
