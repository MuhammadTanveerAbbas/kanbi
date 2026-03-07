export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-6 sm:py-12 px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: March 2025
        </p>
      </div>

      <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-muted-foreground">
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            1. Introduction
          </h2>
          <p className="mb-3">
            KANBI ("we," "us," "our," or "Company") is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you visit our website
            and use our AI powered task management platform.
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with
            our policies and practices, please do not use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            2. Information We Collect
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                2.1 Account Information
              </h3>
              <p>
                When you create an account, we collect your email address and
                password through Supabase Authentication. We do not store your
                password; Supabase handles authentication securely.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                2.2 Board and Task Data
              </h3>
              <p>
                We store your Kanban boards, tasks, notes, and task metadata
                (priority, status, tags) in our Supabase PostgreSQL database.
                This data is associated with your account and is encrypted in
                transit.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                2.3 AI Processing Data
              </h3>
              <p>
                When you use our AI task extraction feature, your note content
                is sent to Google Gemini API and/or Groq API for processing.
                These services process your data according to their own privacy
                policies. We do not store the raw notes sent to AI services;
                only the extracted tasks are saved.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                2.4 Payment Information
              </h3>
              <p>
                Payment processing is handled by Lemon Squeezy. We do not store
                credit card information directly. We receive transaction
                confirmations and subscription status from Lemon Squeezy.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                2.5 Usage Analytics
              </h3>
              <p>
                We collect anonymized usage data including: number of boards
                created, tasks generated, AI API calls, and subscription status.
                This helps us understand feature usage and improve our service.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                2.6 Device and Log Information
              </h3>
              <p>
                We automatically collect IP addresses, browser type, operating
                system, and access timestamps through server logs. This
                information is used for security, fraud prevention, and service
                improvement.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To provide, maintain, and improve our Service</li>
            <li>To process your subscription and payments</li>
            <li>
              To send transactional emails (account confirmations, password
              resets, billing notifications)
            </li>
            <li>To monitor and analyze usage patterns and trends</li>
            <li>To detect, prevent, and address fraud and security issues</li>
            <li>To comply with legal obligations</li>
            <li>To respond to your inquiries and provide customer support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            4. Third-Party Service Providers
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                4.1 Supabase
              </h3>
              <p>
                We use Supabase for database hosting, authentication, and
                real-time features. Your data is stored on Supabase's PostgreSQL
                servers. Supabase is GDPR compliant and maintains SOC 2
                certification.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                4.2 AI Services
              </h3>
              <p>
                Google Gemini and Groq process your notes for task extraction.
                These services may retain data according to their privacy
                policies. We recommend reviewing their privacy policies at
                google.com/privacy and groq.com/privacy.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                4.3 Payment Processor
              </h3>
              <p>
                Lemon Squeezy processes payments and manages subscriptions. It
                complies with PCI DSS standards and does not share your payment
                details with us.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            5. Cookies and Tracking
          </h2>
          <p className="mb-3">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Maintain your session and authentication state</li>
            <li>Remember your preferences (theme, language)</li>
            <li>Analyze website traffic and user behavior</li>
            <li>Prevent fraud and enhance security</li>
          </ul>
          <p className="mt-3">
            You can control cookies through your browser settings. Disabling
            cookies may affect Service functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            6. Data Security
          </h2>
          <p>
            We implement industry-standard security measures including SSL/TLS
            encryption, secure password hashing, and regular security audits.
            However, no method of transmission over the internet is 100% secure.
            We cannot guarantee absolute security of your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            7. Data Retention
          </h2>
          <p>
            We retain your account data as long as your account is active. Upon
            account deletion, we remove your personal data within 30 days,
            except where required by law. Backup copies may persist for up to 90
            days.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            8. Your Rights
          </h2>
          <p className="mb-3">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data in a portable format</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at
            muhammadtanveerabbas.dev@gmail.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            9. Children's Privacy
          </h2>
          <p>
            Our Service is not intended for users under 13 years of age. We do
            not knowingly collect personal information from children under 13.
            If we become aware of such collection, we will delete the
            information immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            10. International Data Transfers
          </h2>
          <p>
            Your data may be transferred to, stored in, and processed in
            countries other than your country of residence. These countries may
            have data protection laws different from your home country. By using
            our Service, you consent to such transfers.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            11. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you
            of material changes by updating the "Last updated" date and posting
            the revised policy on our website. Your continued use of the Service
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
            12. Contact Us
          </h2>
          <p>
            If you have questions about this Privacy Policy or our privacy
            practices, please contact us at:
          </p>
          <div className="mt-4 p-3 sm:p-4 bg-muted rounded-lg">
            <p className="font-semibold">KANBI</p>
            <p>Email: muhammadtanveerabbas.dev@gmail.com</p>
            <p>Location: Pakistan</p>
          </div>
        </section>
      </div>
    </div>
  );
}
