export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Portfolio Project</h2>
          <p className="text-muted-foreground">
            This privacy policy covers KANBI, a portfolio demonstration project by Muhammad Tanveer Abbas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Data We Don't Collect</h2>
          <p className="text-muted-foreground">
            We don't collect personal information, emails, names, or any identifying data. 
            No user accounts, no tracking cookies, no analytics that identify you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Local Storage Only</h2>
          <p className="text-muted-foreground">
            Your tasks and notes are stored only in your browser's local storage. 
            This data never leaves your device unless you use AI features.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. AI Features</h2>
          <p className="text-muted-foreground">
            When you use AI task extraction, your note content is sent to Google's Gemini API for processing. 
            This is optional and only happens when you click the AI button.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. No Third-Party Tracking</h2>
          <p className="text-muted-foreground">
            We don't use Google Analytics, Facebook Pixel, or any tracking services. 
            Your browsing is private.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Data Export</h2>
          <p className="text-muted-foreground">
            You can export your data anytime using the export feature. 
            You own your data completely.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
          <p className="text-muted-foreground">
            Privacy questions? Contact Muhammad Tanveer Abbas through his portfolio website.
          </p>
        </section>
      </div>
    </div>
  );
}