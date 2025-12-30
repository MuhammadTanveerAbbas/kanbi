'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const architectureHighlights = [
  { metric: '15+', label: 'Components', description: 'Modular design' },
  { metric: '100%', label: 'TypeScript', description: 'Type safety' },
  { metric: '0ms', label: 'Server Latency', description: 'Client-side only' },
  { metric: 'Fast', label: 'Performance', description: 'Optimized' }
];

export default function TechStackSection() {
  return (
    <section className="w-full py-12 sm:py-24 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Portfolio Project
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Built with Modern Tech Stack
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Modern web development with Next.js and TypeScript
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {architectureHighlights.map((highlight) => (
            <Card key={highlight.label} className="text-center border-primary/20 bg-primary/5">
              <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-3 sm:px-6">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">{highlight.metric}</div>
                <div className="text-xs sm:text-sm font-medium mb-1">{highlight.label}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{highlight.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-4">
            <strong>Open Source & Free Forever:</strong> Built as a portfolio showcase of modern web development practices.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              ⚡ Client-Side Only
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              📱 Responsive Design
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              🔓 MIT Open Source
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}