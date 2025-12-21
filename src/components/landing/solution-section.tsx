import { FileText, ArrowRight, Download } from "lucide-react";

export default function SolutionSection() {
  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4">
        {/* How it works */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">Here's How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Paste Notes</h3>
              <p className="text-sm text-muted-foreground">Copy your messy notes</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Get Tasks</h3>
              <p className="text-sm text-muted-foreground">AI finds action items</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">Drag tasks to completion</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}