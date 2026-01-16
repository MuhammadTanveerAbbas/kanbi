'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import HeroSection from '@/components/landing/hero-section';

const ProblemSection = dynamic(() => import('@/components/landing/problem-section'), { ssr: false });
const FeaturesSection = dynamic(() => import('@/components/landing/features-section'), { ssr: false });
const HowItWorksSection = dynamic(() => import('@/components/landing/how-it-works-section'), { ssr: false });
const PricingPreviewSection = dynamic(() => import('@/components/landing/pricing-preview-section'), { ssr: false });
const TestimonialsSection = dynamic(() => import('@/components/landing/testimonials-section'), { ssr: false });
const StatsSection = dynamic(() => import('@/components/landing/stats-section'), { ssr: false });
const FinalCtaSection = dynamic(() => import('@/components/landing/final-cta-section'), { ssr: false });

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/dashboard';
    document.head.appendChild(link);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#141414]/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-2 border-2 border-transparent border-t-primary/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-primary">Preparing Your Workspace</p>
            <p className="text-sm text-muted-foreground">Just a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <HeroSection setIsLoading={setIsLoading} />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingPreviewSection />
      <TestimonialsSection />
      <StatsSection />
      <FinalCtaSection setIsLoading={setIsLoading} />
    </div>
  );
}
