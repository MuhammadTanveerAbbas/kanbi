'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface Section {
  id: string
  title: string
  content: string[]
}

const PRIV_SECS: Section[] = [
  { id: 'introduction', title: '1. Introduction', content: ['KANBI ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use Kanbi.', 'Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service.'] },
  { id: 'information-collected', title: '2. Information We Collect', content: ['We collect account information, board and task data, and operational metadata needed to provide the product.', 'When AI features are used, relevant note content may be sent to Groq for processing according to their own privacy policy.'] },
  { id: 'how-we-use-data', title: '3. How We Use Your Information', content: ['We use data to provide and improve Kanbi, process subscriptions, secure accounts, and support customers.', 'We also use aggregate usage signals to improve reliability and product experience.'] },
  { id: 'third-party-services', title: '4. Third-Party Service Providers', content: ['Kanbi uses Supabase for authentication and storage, Groq for AI task extraction/chat capabilities, and Stripe for payments.', 'Each provider has its own privacy and security commitments.'] },
  { id: 'cookies', title: '5. Cookies and Tracking', content: ['We use cookies and related technologies to keep you signed in, remember preferences, and maintain service reliability.', 'You can control cookie behavior through your browser settings.'] },
  { id: 'data-security', title: '6. Data Security', content: ['We implement industry-standard controls including encrypted transport and secure infrastructure practices.', 'No internet transmission method is perfect, so absolute security cannot be guaranteed.'] },
  { id: 'data-retention', title: '7. Data Retention', content: ['We retain account data while your account is active and for limited periods after deletion as required for operations or legal obligations.'] },
  { id: 'your-rights', title: '8. Your Rights', content: ['You may request access, correction, export, or deletion of personal information, subject to applicable law.', 'Contact us to submit privacy-related requests.'] },
  { id: 'children-privacy', title: "9. Children's Privacy", content: ['Kanbi is not intended for children under 13, and we do not knowingly collect personal information from children under that age.'] },
  { id: 'international-transfers', title: '10. International Data Transfers', content: ['Data may be processed in countries outside your own. By using the Service, you consent to those transfers where permitted by law.'] },
  { id: 'policy-changes', title: '11. Changes to This Policy', content: ['We may update this Privacy Policy from time to time. Material updates are reflected by changing the effective date and posting the updated policy.'] },
  { id: 'privacy-contact', title: '12. Contact Us', content: ['For privacy questions, contact: muhammadtanveerabbas.dev@gmail.com'] },
]

const TERMS_SECS: Section[] = [
  { id: 'agreement', title: '1. Agreement to Terms', content: ['By accessing and using Kanbi, you agree to these Terms of Service. If you do not agree, you must not use the Service.'] },
  { id: 'license', title: '2. Use License', content: ['You receive a limited, non-exclusive, revocable license to use Kanbi for lawful purposes in accordance with these terms.'] },
  { id: 'disclaimer', title: '3. Disclaimer', content: ['The Service is provided "as is" and "as available" without warranties of any kind, to the extent permitted by law.'] },
  { id: 'limitations', title: '4. Limitations of Liability', content: ['To the fullest extent permitted by law, Kanbi is not liable for indirect, incidental, or consequential damages from service use.'] },
  { id: 'accounts', title: '5. User Accounts', content: ['You are responsible for account credentials and activity under your account.', 'You must provide accurate registration information and keep it updated.'] },
  { id: 'billing', title: '6. Subscription and Billing', content: ['Paid plans renew automatically unless cancelled.', 'Pricing, refunds, and cancellation terms are presented at checkout and may be updated with notice.'] },
  { id: 'acceptable-use', title: '7. Acceptable Use', content: ['You may not abuse the Service, violate laws, attempt unauthorized access, distribute malware, or infringe third-party rights.'] },
  { id: 'ip-rights', title: '8. Intellectual Property', content: ['Kanbi and related assets are protected by applicable intellectual property laws.', 'Your use of the Service does not transfer ownership of Kanbi intellectual property.'] },
  { id: 'user-content', title: '9. User Content', content: ['You retain rights to your content and grant Kanbi the rights necessary to host and process it for providing the Service.'] },
  { id: 'third-party-links', title: '10. Third-Party Links', content: ['Kanbi may include links to third-party sites. We are not responsible for their content or practices.'] },
  { id: 'termination', title: '11. Termination', content: ['We may suspend or terminate access for violations of these terms or to protect the Service and users.'] },
  { id: 'changes', title: '12. Changes to Terms', content: ['We may revise these terms at any time. Continued use after updates means you accept the revised terms.'] },
  { id: 'governing-law', title: '13. Governing Law', content: ['These terms are governed by applicable law and subject to the jurisdiction stated by Kanbi.'] },
  { id: 'terms-contact', title: '14. Contact Information', content: ['For terms questions, contact: muhammadtanveerabbas.dev@gmail.com'] },
]

export default function LegalPages() {
  const [pathname, setPathname] = useState<string>('/')
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  const isTerms = pathname.includes('/terms')
  const sections = useMemo(() => (isTerms ? TERMS_SECS : PRIV_SECS), [isTerms])
  const pageTitle = isTerms ? 'Terms of Service' : 'Privacy Policy'
  const updatedDate = 'March 2026'

  useEffect(() => {
    if (!sections.length) return
    setActiveId(sections[0].id)

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length === 0) return
        const topEntry = visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        setActiveId(topEntry.target.id)
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0.2, 0.4, 0.7] },
    )

    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [sections])

  const handleTocClick = (id: string): void => {
    const section = document.getElementById(id)
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="legal-page">
      <style jsx>{`
        .legal-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--tx);
          padding: 32px 20px 72px;
        }
        .layout {
          max-width: 1160px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 32px;
        }
        .content {
          min-width: 0;
        }
        .topbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }
        .navgroup {
          display: flex;
          gap: 8px;
        }
        .chip {
          border: 1px solid var(--br);
          background: var(--bg2);
          color: var(--tx);
          border-radius: 999px;
          padding: 8px 12px;
          text-decoration: none;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .chip:hover {
          border-color: var(--brh);
          background: var(--bg3);
        }
        .chip.active {
          background: var(--as);
          border-color: var(--ac);
          color: var(--ac);
        }
        h1 {
          margin: 0;
          font-size: clamp(30px, 4.5vw, 44px);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .updated {
          color: var(--tx2);
          margin: 8px 0 28px;
          font-size: 14px;
        }
        .section {
          border: 1px solid var(--br);
          border-radius: 14px;
          padding: 18px 18px 16px;
          background: var(--bg1);
          margin-bottom: 14px;
          scroll-margin-top: 84px;
        }
        .section h2 {
          margin: 0 0 10px;
          font-size: 20px;
        }
        .section p {
          margin: 0 0 10px;
          line-height: 1.7;
          color: var(--tx2);
        }
        .section p:last-child {
          margin-bottom: 0;
        }
        .toc {
          position: sticky;
          top: 22px;
          align-self: start;
          border: 1px solid var(--br);
          border-radius: 14px;
          background: var(--bg1);
          padding: 14px;
        }
        .toc h3 {
          margin: 0 0 8px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--tx3);
        }
        .toc button {
          width: 100%;
          text-align: left;
          border: 0;
          border-left: 2px solid transparent;
          background: transparent;
          color: var(--tx2);
          padding: 8px 8px 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
        }
        .toc button:hover {
          background: var(--bg2);
          color: var(--tx);
        }
        .toc button.active {
          border-left-color: var(--ac);
          color: var(--ac);
          background: var(--as);
        }
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .toc {
            display: none;
          }
        }
        .legal-page {
          --bg: #07090d;
          --bg1: #0e1219;
          --bg2: #141a23;
          --bg3: #1a2230;
          --br: #1f2b3a;
          --brh: #2a3a50;
          --tx: #f3f7ff;
          --tx2: #b9c6db;
          --tx3: #89a0c3;
          --ac: #6ea8ff;
          --as: rgba(110, 168, 255, 0.14);
        }
        :global(.light) .legal-page {
          --bg: #f6f8fc;
          --bg1: #ffffff;
          --bg2: #eef3fa;
          --bg3: #e7edf7;
          --br: #dbe5f2;
          --brh: #c8d7ea;
          --tx: #0f1c2f;
          --tx2: #3e526d;
          --tx3: #6a7f9d;
          --ac: #0f62fe;
          --as: rgba(15, 98, 254, 0.1);
        }
      `}</style>

      <div className="layout">
        <main className="content">
          <div className="topbar">
            <div className="navgroup">
              <Link href="/" className="chip">
                Home
              </Link>
            </div>
            <div className="navgroup">
              <Link href="/privacy" className={`chip ${!isTerms ? 'active' : ''}`}>
                Privacy
              </Link>
              <Link href="/terms" className={`chip ${isTerms ? 'active' : ''}`}>
                Terms
              </Link>
            </div>
          </div>

          <h1>{pageTitle}</h1>
          <p className="updated">Last updated: {updatedDate}</p>

          {sections.map((section) => (
            <section id={section.id} key={section.id} className="section">
              <h2>{section.title}</h2>
              {section.content.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </section>
          ))}
        </main>

        <aside className="toc" aria-label="Table of contents">
          <h3>On this page</h3>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeId === section.id ? 'active' : ''}
              onClick={() => handleTocClick(section.id)}
            >
              {section.title}
            </button>
          ))}
        </aside>
      </div>
    </div>
  )
}
