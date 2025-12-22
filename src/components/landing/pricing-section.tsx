'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code2, Zap, Shield, Smartphone, Database, Palette } from 'lucide-react';

const techCategories = [
  {
    name: 'Frontend Excellence',
    icon: <Code2 className="h-5 w-5" />,
    technologies: [
      { name: 'Next.js 15', description: 'Latest React framework with App Router' },
      { name: 'React 18', description: 'Modern hooks and concurrent features' },
      { name: 'TypeScript', description: '100% type-safe development' },
      { name: 'Tailwind CSS', description: 'Utility-first styling system' }
    ]
  },
  {
    name: 'Performance & UX',
    icon: <Zap className="h-5 w-5" />,
    technologies: [
      { name: 'Server Components', description: 'Optimized rendering strategy' },
      { name: 'Dynamic Imports', description: 'Code splitting for faster loads' },
      { name: 'Local Storage', description: 'Instant offline functionality' },
      { name: 'Responsive Design', description: 'Mobile-first architecture' }
    ]
  },
  {
    name: 'Privacy & Security',
    icon: <Shield className="h-5 w-5" />,
    technologies: [
      { name: 'Client-Side Only', description: 'Zero server data collection' },
      { name: 'Local Data Storage', description: 'Your data never leaves your device' },
      { name: 'No Tracking', description: 'Privacy-first architecture' },
      { name: 'Open Source', description: 'Transparent and auditable code' }
    ]
  }
];

const architectureHighlights = [
  { metric: '25+', label: 'Reusable Components', description: 'Modular design system' },
  { metric: '100%', label: 'TypeScript Coverage', description: 'Complete type safety' },
  { metric: '0ms', label: 'Server Latency', description: 'Fully client-side' },
  { metric: 'A+', label: 'Performance Score', description: 'Optimized for speed' }
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
            Showcasing cutting-edge development practices and enterprise-grade architecture
          </p>
        </div>

        {/* Architecture Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
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

        {/* Tech Stack Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {techCategories.map((category) => (
            <Card key={category.name} className="border-primary/20 hover:border-primary/40 transition-colors text-center">
              <CardHeader className="pb-3 sm:pb-4 pt-4 sm:pt-6">
                <div className="inline-flex p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 bg-muted mx-auto">
                  {category.icon}
                </div>
                <div className="w-full h-px bg-muted mb-2 sm:mb-3"></div>
                <CardTitle className="text-base sm:text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                {category.technologies.map((tech) => (
                  <div key={tech.name} className="space-y-1 text-center">
                    <span className="font-medium text-xs sm:text-sm block">{tech.name}</span>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{tech.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Development Philosophy */}
        <div className="text-center space-y-6 sm:space-y-8">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Development Philosophy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="inline-flex p-2 rounded-lg bg-muted">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base">Mobile-First</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Responsive design that works perfectly on all devices
                </p>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="inline-flex p-2 rounded-lg bg-muted">
                  <Database className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base">Privacy-First</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  All data stays local - no servers, no tracking, no compromises
                </p>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="inline-flex p-2 rounded-lg bg-muted">
                  <Palette className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base">User-Centric</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Clean interface with intuitive interactions and accessibility
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-primary/20 pt-6 sm:pt-8">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-4">
              <strong>Open Source & Free Forever:</strong> Built as a portfolio showcase of modern web development practices.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                ⚡ Lightning Fast Performance
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                📱 Fully Responsive Design
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                🔓 MIT Open Source
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}