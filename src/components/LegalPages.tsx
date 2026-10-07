'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useTheme } from '@/lib/theme'

interface Section {
  id: string
  title: string
  content: string[]
}

const PRIV_SECS: Section[] = [
  { id: 'introduction', title: '1. Introduction', content: ['KANBI (\"we,\" \"us,\" \"our,\" or \"Company\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use Kanbi.', 'Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service.'] },
  { id: 'information-collected', title: '2. Information We Collect', content: ['We collect account information, board and task data, and operational metadata needed to provide the product.', 'When AI features are used, relevant note content is sent to the language model runtime configured for this deployment, which is processed under that provider\'s own privacy policy.'] },
  { id: 'how-we-use-data', title: '3. How We Use Your Information', content: ['We use data to provide and improve Kanbi, process subscriptions, secure accounts, and support customers.', 'We also use aggregate usage signals to improve reliability and product experience.'] },
  { id: 'third-party-services', title: '4. Third-Party Service Providers', content: ['Kanbi uses Supabase for authentication and storage, an open-weight language model runtime for task extraction and assistant features, and Stripe for payments.', 'Each provider has its own privacy and security commitments.'] },
  { id: 'cookies', title: '5. Cookies and Tracking', content: ['We use cookies and related technologies to keep you signed in, remember preferences, and maintain service reliability.', 'You can control cookie behavior through your browser settings.'] },
  { id: 'data-security', title: '6. Data Security', content: ['We implement industry-standard controls including encrypted transport and secure infrastructure practices.', 'No internet transmission method is perfect, so absolute security cannot be guaranteed.'] },
  { id: 'data-retention', title: '7. Data Retention', content: ['We retain account data while your account is active and for limited periods after deletion as required for operations or legal obligations.'] },
  { id: 'your-rights', title: '8. Your Rights', content: ['You may request access, correction, export, or deletion of personal information, subject to applicable law.', 'Contact us to submit privacy-related requests.'] },
  { id: 'children-privacy', title: "9. Children's Privacy", content: ['Kanbi is not intended for children under 13, and we do not knowingly collect personal information from children under that age.'] },
  { id: 'international-transfers', title: '10. International Data Transfers', content: ['Data may be processed in countries outside your own. By using the Service, you consent to those transfers where permitted by law.'] },
  { id: 'policy-changes', title: '11. Changes to This Policy', content: ['We may update this Privacy Policy from time to time. Material updates are reflected by changing the effective date and posting the updated policy.'] },
  { id: 'privacy-contact', title: '12. Contact Us', content: ['For privacy questions, contact: support@kanbi.app'] },
]

const TERMS_SECS: Section[] = [
  { id: 'agreement', title: '1. Agreement to Terms', content: ['By accessing and using Kanbi, you agree to these Terms of Service. If you do not agree, you must not use the Service.'] },
  { id: 'license', title: '2. Use License', content: ['You receive a limited, non-exclusive, revocable license to use Kanbi for lawful purposes in accordance with these terms.'] },
  { id: 'disclaimer', title: '3. Disclaimer', content: ['The Service is provided \"as is\" and \"as available\" without warranties of any kind, to the extent permitted by law.'] },
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
  { id: 'terms-contact', title: '14. Contact Information', content: ['For terms questions, contact: support@kanbi.app'] },
]

function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function LegalPages() {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const { theme, toggle: toggleTheme } = useTheme()

  const isTerms = pathname.includes('/terms')
  const sections = useMemo(() => (isTerms ? TERMS_SECS : PRIV_SECS), [isTerms])
  const pageTitle = isTerms ? 'Terms of Service' : 'Privacy Policy'
  const updatedDate = 'March 2026'

  return (
    <div className="legal-page">
      <style jsx>{`
        .legal-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--tx);
          font-family: var(--font-body);
        }
        .topbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg);
          border-bottom: 1px solid var(--br);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .topbar-inner {
          max-width: 820px;
          margin: 0 auto;
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--bg2);
          border: 1px solid var(--br);
          color: var(--tx2);
          border-radius: 10px;
          padding: 7px 14px 7px 10px;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          line-height: 1;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.12s;
          text-decoration: none;
        }
        .back-btn:hover {
          background: var(--bg3);
          border-color: var(--brh);
          color: var(--tx);
          transform: translateX(-2px);
        }
        .back-btn:active {
          transform: translateX(-1px);
        }
        .back-btn:focus-visible {
          outline: 2px solid var(--ac);
          outline-offset: 2px;
        }
        .theme-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg2);
          border: 1px solid var(--br);
          color: var(--tx2);
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          line-height: 1;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .theme-btn:hover {
          background: var(--bg3);
          border-color: var(--brh);
          color: var(--tx);
        }
        .theme-btn:focus-visible {
          outline: 2px solid var(--ac);
          outline-offset: 2px;
        }
        .layout {
          max-width: 820px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }
        .page-header {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--br);
        }
        .page-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg2);
          border: 1px solid var(--br);
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--tx3);
          margin-bottom: 16px;
        }
        h1 {
          margin: 0 0 8px;
          font-size: clamp(26px, 5vw, 40px);
          line-height: 1.1;
          letter-spacing: -0.03em;
          font-weight: 700;
          color: var(--tx);
        }
        .updated {
          color: var(--tx3);
          margin: 0;
          font-size: 13px;
        }
        .sections {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .section {
          border: 1px solid var(--br);
          border-radius: 12px;
          padding: 20px 22px 18px;
          background: var(--bg1);
          transition: border-color 0.15s;
        }
        .section:hover {
          border-color: var(--brh);
        }
        .section h2 {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 600;
          color: var(--tx);
          letter-spacing: -0.01em;
        }
        .section p {
          margin: 0 0 8px;
          line-height: 1.75;
          color: var(--tx2);
          font-size: 14px;
        }
        .section p:last-child {
          margin-bottom: 0;
        }
        @media (max-width: 600px) {
          .topbar-inner { padding: 0 16px; height: 52px; }
          .layout { padding: 28px 16px 64px; }
          .back-btn span { display: none; }
          .back-btn { padding: 8px 10px; border-radius: 9px; }
          .section { padding: 16px 16px 14px; border-radius: 10px; }
          h1 { font-size: clamp(22px, 6vw, 32px); }
        }
        @media (max-width: 380px) {
          .layout { padding: 20px 12px 56px; }
        }
      `}</style>

      <div className="topbar">
        <div className="topbar-inner">
          <button
            type="button"
            className="back-btn"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <BackIcon />
            <span>Back</span>
          </button>
          <button
            type="button"
            className="theme-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      <div className="layout">
        <div className="page-header">
          <div className="page-badge">Legal</div>
          <h1>{pageTitle}</h1>
          <p className="updated">Last updated: {updatedDate}</p>
        </div>

        <div className="sections">
          {sections.map((section) => (
            <section id={section.id} key={section.id} className="section">
              <h2>{section.title}</h2>
              {section.content.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
