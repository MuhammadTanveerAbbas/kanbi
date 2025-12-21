export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Portfolio Project Notice</h2>
          <p className="text-muted-foreground">
            KANBI is a portfolio demonstration project created by Muhammad Tanveer Abbas to showcase web development capabilities. 
            This is not a commercial service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
          <p className="text-muted-foreground">
            KANBI helps organize notes into tasks using a simple Kanban interface. Data is stored locally in your browser.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Data Handling</h2>
          <p className="text-muted-foreground">
            Your data stays in your browser's local storage. We don't collect personal information. 
            AI features may process note content through third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Use at Your Own Risk</h2>
          <p className="text-muted-foreground">
            This is a demonstration project. We're not liable for data loss or any issues from using this application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Contact</h2>
          <p className="text-muted-foreground">
            Questions? Contact Muhammad Tanveer Abbas through his portfolio website.
          </p>
        </section>
      </div>
    </div>
  );
}