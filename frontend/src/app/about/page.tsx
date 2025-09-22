'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header Row with Back Button and Title */}
        <div className="flex items-center justify-between mb-12 py-10">
          {/* Back to Dashboard Button */}
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-full hover:bg-gray-100 transition-all duration-300 font-medium hover:-translate-y-1 hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M6 8L2 12L6 16"/>
              <path d="M2 12H22"/>
            </svg>
            Back to Dashboard
          </Link>

          {/* Center Title */}
          <div className="flex flex-col items-center">
            <h1 className="text-5xl font-bold text-foreground">
              Helium OS
            </h1>
            <p className="text-lg text-muted-foreground">
              by Neural Arc
            </p>
          </div>

          {/* Empty div for balance */}
          <div className="w-48"></div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Description */}
          <div className="text-left mb-16">
            <p className="text-2xl text-muted-foreground leading-relaxed mb-6">
              Cognitive Core of Enterprise Operations
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Leveraging advanced LLM orchestration and a multi-agent architecture, Helium AI delivers AI-driven intelligence, real-time decision-making, and seamless integration across all business functions—accelerating your enterprise's go-to-market strategy.
            </p>
          </div>


          {/* Why Helium OS Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="text-left">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Why Helium OS?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Enterprises today face complexity, fragmented tools, and decision bottlenecks. Helium OS eliminates these challenges by serving as the cognitive backbone of the enterprise. It doesn't just process information—it understands context, prioritizes actions, and orchestrates execution, enabling organizations to:
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">Accelerate go-to-market strategies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">Reduce operational inefficiencies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">Enhance cross-functional collaboration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">Ensure agility in a rapidly changing business environment</span>
                </li>
              </ul>

              <h3 className="text-2xl font-bold text-foreground mb-4">
                The Future of Enterprise, Today
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Helium OS is more than a platform—it's the intelligence fabric of modern business. By embedding cognitive AI at the core of operations, it empowers enterprises to achieve sustainable growth, resilience, and competitive edge in the AI-driven era.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-4">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <span>All Copyrights Reserved 2025</span>
            <span className="mx-2">•</span>
            <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground">
              <Link href="/terms-of-use">
                Terms of Use
              </Link>
            </Button>
            <span className="mx-2">•</span>
            <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground">
              <Link href="/privacy-policy">
                Privacy Policy
              </Link>
            </Button>
            <span className="mx-2">•</span>
            <span>
              A product by{' '}
              <Link 
                href="https://neuralarc.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Neural Arc
              </Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
