'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Fragment, useMemo } from 'react'
import { useTheme } from '@/lib/theme'

/* Contact goes to the developer rather than a role address, because there is
   no support team behind this project. */
const CONTACT_EMAIL = 'muhammadtanveerabbas.contact@gmail.com'

interface Section {
  id: string
  title: string
  content: string[]
  /** Optional short list rendered under the paragraphs. */
  items?: string[]
}

/* The content below describes how this deployment is actually built, which is
   why it names Supabase, Stripe, an open weight model runtime, and Vercel
   instead of speaking in generalities. No section promises a control that the
   code does not have. */

const PRIV_SECS: Section[] = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: [
      'This Privacy Policy explains what Kanbi collects, why it collects it, and who can see it. Kanbi is an AI assisted Kanban board for solo developers, freelancers, and small teams who want to turn notes, PDFs, and web page URLs into an organised task board.',
      'By creating an account or using the service you accept the practices described here. If you do not agree with them, do not use the service.',
    ],
  },
  {
    id: 'information-collected',
    title: '2. Information We Collect',
    content: ['We collect only what the product needs to run. There is no third party advertising and no data broker anywhere in the stack.'],
    items: [
      'Account data: the email address you sign up with and the password hash held by Supabase Auth. We never see or store a raw password.',
      'Board data: the boards and tasks you create, with their titles, descriptions, priorities, due dates, column positions, and completion state.',
      'Input content: the text you paste, the PDFs you upload, and the public URLs you submit for parsing.',
      'Usage data: request counts against the free and premium limits, task activity timestamps, and error logs used for debugging.',
      'Billing data: your plan and subscription status. Card details are entered on Stripe and never pass through Kanbi servers.',
    ],
  },
  {
    id: 'how-we-use-data',
    title: '3. How We Use Your Information',
    content: [
      'Your data is used to operate the product for you, and for nothing else. Specifically we use it to authenticate you, store and render your boards, score your workload, answer your assistant questions in the context of your board, and process your subscription.',
      'We also use aggregate counts, such as how many extraction requests succeed or fail, to improve reliability. Those measurements are not linked to your identity in product analytics.',
    ],
  },
  {
    id: 'ai-processing',
    title: '4. AI Processing and the Model Runtime',
    content: [
      'Kanbi separates computation from generation on purpose. The workload health score, the burnout risk calculation, deadline clustering, time estimates, and the autopilot daily schedule are ordinary deterministic code. No model is involved in those numbers and no board data leaves the server to produce them.',
      'A language model is used only where language understanding is required: reading a note and deciding which lines are tasks, and answering questions about your board in plain language. When you use those features, the relevant text of your note or your question is sent to the model runtime configured for this deployment, along with your board context when the assistant needs it. That runtime is a separate processor for your content and applies its own policy to it.',
      'If no model runtime is configured, or the provider is unavailable, the product degrades instead of breaking. Extraction falls back to parsing bullet and numbered lines, the assistant returns a rule based reply, and the interface tells you that a fallback was used rather than presenting a model answer as fact.',
    ],
  },
  {
    id: 'service-providers',
    title: '5. Service Providers We Rely On',
    content: ['We use a small number of processors, and each one receives only the data it needs to do its job.'],
    items: [
      'Supabase: authentication, the PostgreSQL database, and the row level security policies that keep your rows visible only to you.',
      'Stripe: subscription checkout, the billing portal, and the webhook events that keep your plan state in sync.',
      'The configured model runtime: open weight models served over an OpenAI compatible API, used for extraction and the assistant.',
      'Vercel: hosting and request routing for the application.',
      'Upstash Redis: optional distributed rate limiting, used only when its environment variables are set.',
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies and Local Storage',
    content: [
      'We use a session cookie issued by Supabase Auth to keep you signed in, plus local storage to remember your theme choice and your place on a long page. There are no advertising cookies, no third party tracking pixels, and no cross site profiling.',
      'You can clear or block cookies in your browser settings. Blocking the session cookie signs you out, and nothing else stops working.',
    ],
  },
  {
    id: 'data-security',
    title: '7. Data Security',
    content: [
      'Every database table in this project is protected by Supabase row level security, so a request without a valid session cannot read or write the rows of another account, not even if it reaches the database directly. All traffic uses HTTPS, and outbound fetches of URLs you supply go through an SSRF safe helper that blocks private address ranges.',
      'We also apply rate limiting per IP and per account on mutating routes, sanitise inputs, and validate request bodies against a schema before they are used. We do not claim a guarantee of absolute security, because no internet service can promise one.',
    ],
  },
  {
    id: 'data-retention',
    title: '8. Data Retention and Deletion',
    content: [
      'Account and board data is kept while your account is active. Boards you delete and messages you clear are removed from the database on request or by the scheduled cleanup job. Operational logs are kept only as long as needed to investigate a failure.',
      'If you close your account, your boards and tasks are deleted and your subscription is cancelled. Records that a payment processor or tax law requires us to keep, such as an invoice, are retained for that period and then removed.',
    ],
  },
  {
    id: 'your-rights',
    title: '9. Your Rights and Choices',
    content: [
      'You can export any saved board as a DOCX or PDF file from the Saved Boards page or from Settings, which gives you a portable copy of your own content at any time.',
      'You can edit or delete boards and tasks inside the product. You can also request access to, correction of, or deletion of your personal information, object to processing, or withdraw consent, by writing to the address given in section 10. We respond to valid requests within the period required by applicable law.',
    ],
  },
  {
    id: 'changes-contact',
    title: '10. Children, Transfers, Policy Changes, and Contact',
    content: [
      'Kanbi is a work tool and is not directed at children under 13. We do not knowingly collect personal information from children under that age.',
      'Our providers store data in the regions they operate, which may include countries other than your own. By using the service you accept that your information may be processed outside your country where the law permits it.',
      'We update this policy when the product changes. Material changes are reflected in the date at the top of this page. Continuing to use the service after an update means you accept the revised policy.',
      'Privacy questions, access requests, and deletion requests all go to Kanbi\'s developer at muhammadtanveerabbas.contact@gmail.com. Kanbi is built and maintained by Muhammad Tanveer Abbas, so the person who wrote the code is the person who reads these messages and answers them.',
    ],
  },
]

const TERMS_SECS: Section[] = [
  {
    id: 'agreement',
    title: '1. Agreement to These Terms',
    content: [
      'These Terms of Service are a legal agreement between you and Kanbi. By creating an account or using the service you accept them. If you do not accept them, do not use the service.',
      'We may update these terms from time to time. The date at the top of the page shows when they were last revised.',
    ],
  },
  {
    id: 'what-it-is',
    title: '2. What Kanbi Is, and What It Is Not',
    content: [
      'Kanbi turns notes, PDFs, and public web page URLs into an organised task board, then helps you plan the week. It is built for solo developers, freelancers, and small teams.',
      'It is a productivity aid, not a source of truth about your life. The board health score is a heuristic computed from the proportion of high and urgent tasks on your board. It does not read your calendar, your real working hours, or how long a task actually took you. Treat it as a prompt to look at your week, not as a measurement of it.',
    ],
  },
  {
    id: 'accounts',
    title: '3. Accounts and Your Responsibilities',
    content: [
      'You are responsible for the credentials on your account and for everything done under it. Keep your sign in details private and give accurate registration information.',
      'One account belongs to one person or one organisation. Sharing a single login across unrelated users breaks the per account usage limits and the row level security that keeps your data separate, so please do not do it.',
      'You must be old enough to form a binding contract in your jurisdiction, and at least 13 years old.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    content: ['You agree not to use Kanbi in a way that harms the service, its users, or anyone else. In particular:'],
    items: [
      'Do not submit content you do not have the right to process, including copyrighted or confidential material that belongs to someone else.',
      'Do not attempt to access another account, probe the service for vulnerabilities without permission, or bypass rate limits and usage caps.',
      'Do not upload malware, abuse the export or parsing features to attack another system, or use the service for anything unlawful.',
      'Do not resell, redistribute, or run a competing hosted version of the service without written permission.',
    ],
  },
  {
    id: 'your-content',
    title: '5. Your Content and Exports',
    content: [
      'You keep ownership of the notes, PDFs, URLs, boards, and tasks you create. You grant Kanbi only the rights needed to host, process, and display that content for you, and those rights end when you delete it.',
      'You can export a saved board as DOCX or PDF at any time. The resulting file is yours, with no strings attached.',
    ],
  },
  {
    id: 'billing',
    title: '6. Plans, Billing, and Usage Limits',
    content: [
      'Kanbi has a free plan and a premium plan at $9 per month. Payments are handled by Stripe. A paid subscription renews automatically each month until you cancel, and you can cancel at any time from the billing portal, with access continuing until the end of the period you already paid for.',
      'Usage limits are enforced at request time from a single set of constants. The free plan allows 10 AI requests per day and 300 per month, plus 10 board saves per day and 300 per month. The premium plan raises both to 100 per day and 1,500 per month. We may adjust these limits, and we will give notice before a change affects an existing paid subscriber.',
      'Refunds are handled case by case. Write to muhammadtanveerabbas.contact@gmail.com with the reason and you will get an answer from the developer personally.',
    ],
  },
  {
    id: 'ai-behaviour',
    title: '7. AI Output and How to Use It',
    content: [
      'Extraction and assistant answers come from a language model. Model output can be wrong, incomplete, or confidently mistaken, and extraction quality has not been benchmarked against a fixed evaluation set. Review what lands on your board before you act on it.',
      'Kanbi never hardcodes a model vendor. On each request it reads the live model catalogue from the configured runtime, picks a model that can satisfy that request, and rotates to an alternative when the first one fails. That is why availability and the character of the output can change over time without notice.',
      'You must verify model output before relying on it for any decision that matters.',
    ],
  },
  {
    id: 'ip-and-license',
    title: '8. Intellectual Property and Licence',
    content: [
      'The Kanbi name, interface, and code are owned by Kanbi and protected by copyright and trade mark law. You may not copy, resell, or trade on them.',
      'The Kanbi source code is published under the MIT Licence, so you may read it, run it yourself, and modify it under that licence. The MIT Licence covers the repository, not a hosted copy of the service that we run for you.',
    ],
  },
  {
    id: 'third-parties',
    title: '9. Third Parties and Links',
    content: [
      'Kanbi depends on Supabase for accounts and storage, Stripe for payments, Vercel for hosting, and a model runtime for the AI features. Their own terms and privacy policies apply to you when you use those services.',
      'The service may link to third party sites, including documentation and the public repository. We do not control them, and we are not responsible for their content or practices.',
    ],
  },
  {
    id: 'liability',
    title: '10. Disclaimers, Liability, Termination, and Contact',
    content: [
      'The service is provided as is and as available, without warranties of any kind, to the fullest extent the law allows. We do not promise that it will be uninterrupted, that model output will be accurate, or that it will produce a particular business outcome.',
      'To the fullest extent permitted by law, Kanbi is not liable for indirect, incidental, special, or consequential damages arising from your use of the service, including lost data or lost profit.',
      'You may stop using the service at any time. We may suspend or terminate access if you break these terms, if we detect abuse that threatens other users, or if the law requires it. Where you are a paying subscriber, we will give notice and refund any unused portion where the law requires it.',
      'Any question about these terms goes to the developer of this project, Muhammad Tanveer Abbas, at muhammadtanveerabbas.contact@gmail.com.',
    ],
  },
]

/* Copy the contact email to the system clipboard and show temporary feedback. */
function copyToClipboard(email: string) {
  if (!navigator.clipboard) {
    /* Fallback for older browsers */
    const textarea = document.createElement('textarea')
    textarea.value = email
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return
  }
  navigator.clipboard.writeText(email).then(
    () => { /* success */ },
    () => { /* fallback */ }
  )
}

function renderText(text: string) {
  if (!text.includes(CONTACT_EMAIL)) return text
  const parts = text.split(CONTACT_EMAIL)
  return parts.map((part, i) => (
    <Fragment key={part + i}>
      {part}
      {i < parts.length - 1 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          <button
            className="copy-mail-btn"
            aria-label="Copy email address"
            onClick={() => copyToClipboard(CONTACT_EMAIL)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ac-text)',
              padding: 4,
              borderRadius: 6,
              transition: 'background 0.15s',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span style={{ color: 'var(--tx2)', fontSize: 13, whiteSpace: 'nowrap' }}>
            {CONTACT_EMAIL}
          </span>
        </div>
      )}
    </Fragment>
  ))
}

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

          {/* A ten item policy is long enough that a reader needs to see the
              shape of it before scrolling. */}
          <nav className="toc" aria-label="On this page">
            <p className="toc-label">On this page</p>
            <ol>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title.replace(/^\d+\.\s*/, '')}</a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="sections">
          {sections.map((section) => (
            <section id={section.id} key={section.id} className="section">
              <h2>{section.title}</h2>
              {section.content.map((text) => (
                <p key={text}>{renderText(text)}</p>
              ))}
              {section.items && (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{renderText(item)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="page-switch">
          <Link href={isTerms ? '/privacy' : '/terms'}>
            {isTerms ? 'Read the Privacy Policy' : 'Read the Terms of Service'}
          </Link>
          <Link href="/">Back to Kanbi</Link>
        </div>
      </div>
    </div>
  )
}
