'use client';

import HeroSection from '@/components/hero-section-1';
import FeaturesSection from '@/components/features-7';
import Features from '@/components/features-10';
import IntegrationsSection from '@/components/integrations-7';
import Footer from '@/components/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      <HeroSection />      
      <FeaturesSection />
      <Features />
      <IntegrationsSection />
      <Footer />
    </main>
  );
}
