'use client';

import HeroSection from '@/components/hero-section-1';
import FeaturesSection from '@/components/features-7';
import FeatureTable from '@/components/feature-table';
import IntegrationsSection from '@/components/integrations-7';
import CompareTable from '@/components/compare-table';
import Footer from '@/components/footer';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Comparison from '@/components/comparison';

export default function HomePage() {
  return (
    <LanguageProvider>
      <main className="min-h-screen bg-black">
        <HeroSection />
        <Comparison/>
        <FeaturesSection />
        <FeatureTable />
        <IntegrationsSection />
        <CompareTable />
        <Footer />
      </main>
    </LanguageProvider>
  );
}
