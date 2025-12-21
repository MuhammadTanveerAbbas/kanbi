export default function SocialProofSection() {
  return (
    <section className="w-full py-12 bg-muted/20">
      <div className="container mx-auto text-center px-4">
        <h2 className="text-2xl font-bold mb-8">
          Simple, Honest Tool
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">~30 sec</div>
            <p className="text-sm text-muted-foreground">To start organizing your first notes</p>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">0</div>
            <p className="text-sm text-muted-foreground">Signups required to start</p>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">100%</div>
            <p className="text-sm text-muted-foreground">Private - your data stays local</p>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <p>"A straightforward tool that does exactly what it says."</p>
          <p className="mt-2">— The goal we're aiming for</p>
        </div>
      </div>
    </section>
  );
}