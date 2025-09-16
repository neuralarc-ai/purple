'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LegalPage() {
  return (
    <>
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex items-center justify-center mb-10 relative">
          <Link
            href="/"
            className="absolute left-0 group border border-border/50 bg-background hover:bg-accent/20 hover:border-secondary/40 rounded-full text-sm h-8 px-3 flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
          >
            <ArrowLeft size={14} className="text-muted-foreground" />
            <span className="font-medium text-muted-foreground text-xs tracking-wide">
              Back
            </span>
          </Link>

          <h1 className="text-3xl md:text-4xl font-medium tracking-tighter text-center">
            Legal <span className="text-secondary">Information</span>
          </h1>
        </div>

        <div className="rounded-xl border border-border bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] p-8 shadow-sm">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <h2 className="text-2xl font-medium tracking-tight mb-4">
                  Terms of Service
                </h2>
                <p className="text-muted-foreground mb-4">
                  Read our terms of service to understand your rights and responsibilities when using our platform.
                </p>
                <Link 
                  href="/legal/terms"
                  className="inline-flex items-center gap-2 text-secondary hover:underline font-medium"
                >
                  View Terms of Service
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>

              <div>
                <h2 className="text-2xl font-medium tracking-tight mb-4">
                  Privacy Policy
                </h2>
                <p className="text-muted-foreground mb-4">
                  Learn how we collect, use, and protect your personal information.
                </p>
                <Link 
                  href="/legal/privacy"
                  className="inline-flex items-center gap-2 text-secondary hover:underline font-medium"
                >
                  View Privacy Policy
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center pb-10">
          <Link
            href="/"
            className="group inline-flex h-10 items-center justify-center gap-2 text-sm font-medium tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground px-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] bg-primary hover:bg-primary/90 transition-all duration-200 w-fit"
          >
            <span>Return to Home</span>
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-200">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M7 17L17 7M17 7H8M17 7V16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}