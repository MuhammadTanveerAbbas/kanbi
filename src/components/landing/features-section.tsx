import { Card, CardContent } from '@/components/ui/card';
import { Shield, Zap, Download } from 'lucide-react';

const benefits = [
  {
    icon: <Zap className="h-6 w-6 text-primary" />,
    name: 'Start Immediately',
    description: 'No signup, no download, no setup. Just open and start organizing.',
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    name: 'Your Data Stays Private',
    description: 'Everything stays in your browser. We never see your notes or tasks.',
  },
  {
    icon: <Download className="h-6 w-6 text-primary" />,
    name: 'Take Your Tasks Anywhere',
    description: 'Save your tasks to a file. Open them on any device, anytime.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="w-full py-12 sm:py-24 bg-black">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Why Founders Choose This
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
          Built for people who need to get organized fast, without the hassle.
        </p>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {benefits.map((benefit) => (
            <Card key={benefit.name} className="text-left border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}