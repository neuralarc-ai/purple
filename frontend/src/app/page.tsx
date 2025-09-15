'use client';

import HeroSection from '@/components/hero-section-1';
import FeaturesSection from '@/components/features-7';
import FeatureTable from '@/components/feature-table';
import IntegrationsSection from '@/components/integrations-7';
import PromptMessage from '@/components/prompt-message';
import CompareTable from '@/components/compare-table';
import Footer from '@/components/footer';
import Comparison from '@/components/comparison';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      <HeroSection />      
      <FeaturesSection />
      <Comparison />
      <IntegrationsSection />
      <FeatureTable />
      <PromptMessage />
      <CompareTable />
      <Footer />
    </main>
  );
}
