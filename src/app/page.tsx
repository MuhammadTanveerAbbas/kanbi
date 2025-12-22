'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

import HeroSection from '@/components/landing/hero-section';
import { Skeleton } from '@/components/ui/skeleton';

const SolutionSection = dynamic(() => import('@/components/landing/solution-section'), { ssr: true });
const FeaturesSection = dynamic(() => import('@/components/landing/features-section'), { ssr: true });
const SocialProofSection = dynamic(() => import('@/components/landing/social-proof-section'), { ssr: true });
const TechStackSection = dynamic(() => import('@/components/landing/pricing-section'), { ssr: true });
const FaqSection = dynamic(() => import('@/components/landing/faq-section'), { ssr: true });
const FinalCtaSection = dynamic(() => import('@/components/landing/final-cta-section'), { ssr: true });

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  // Preload board route
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/board';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-primary/40 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading your workspace...</p>
            <p className="text-sm text-muted-foreground">Getting everything ready</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <HeroSection setIsLoading={setIsLoading} />
      <Suspense fallback={<div className="h-96" />}>
        <SolutionSection />
        <FeaturesSection />
        <TechStackSection />
        <FaqSection />
        <FinalCtaSection setIsLoading={setIsLoading} />
      </Suspense>
    </div>
  );
}