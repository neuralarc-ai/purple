'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FlickeringGrid } from '@/components/home/ui/flickering-grid';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState, useEffect } from 'react';

export default function TermsOfUsePage() {
  const tablet = useMediaQuery('(max-width: 1024px)');
  const [mounted, setMounted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full">
      <section className="w-full relative overflow-hidden pb-20">
        <div className="relative flex flex-col items-center w-full px-6 pt-10">
          {/* Left side flickering grid with gradient fades - similar to hero section */}
          <div className="absolute left-0 top-0 h-[600px] w-1/3 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background z-10" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />

            {mounted && (
              <FlickeringGrid
                className="h-full w-full"
                squareSize={tablet ? 2 : 2.5}
                gridGap={tablet ? 2 : 2.5}
                color="var(--secondary)"
                maxOpacity={0.4}
                flickerChance={isScrolling ? 0.01 : 0.03}
              />
            )}
          </div>

          {/* Right side flickering grid with gradient fades */}
          <div className="absolute right-0 top-0 h-[600px] w-1/3 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background z-10" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />

            {mounted && (
              <FlickeringGrid
                className="h-full w-full"
                squareSize={tablet ? 2 : 2.5}
                gridGap={tablet ? 2 : 2.5}
                color="var(--secondary)"
                maxOpacity={0.4}
                flickerChance={isScrolling ? 0.01 : 0.03}
              />
            )}
          </div>

          {/* Center content background with rounded bottom */}
          <div className="absolute inset-x-1/4 top-0 h-[600px] -z-20 bg-background rounded-b-xl"></div>

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
                Helium Terms of <span className="text-secondary">Use</span>
              </h1>
            </div>

            <div className="rounded-xl border border-border bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] p-8 shadow-sm">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-sm text-muted-foreground mb-6">
                  Last updated: {new Date().toLocaleDateString()}
                </p>

                <ol className="list-decimal pl-5 space-y-4 text-muted-foreground">
                  <li>
                    <strong>Introduction</strong>
                    <p>Welcome to Helium, a product of Neural Arc Inc. ("Company," "we," "our," or "us"). These Terms of Use ("Terms") govern your access to and use of the Helium platform, services, applications, and related content (collectively, the "Services"). By using our Services, you agree to be bound by these Terms. If you do not agree, you must not use our Services.</p>
                  </li>
                  
                  <li>
                    <strong>Eligibility</strong>
                    <p>You must be at least 18 years old or the legal age of majority in your jurisdiction to use Helium. By accessing the Services, you represent that you meet these requirements.</p>
                  </li>
                  
                  <li>
                    <strong>Account Registration and Responsibilities</strong>
                    <p>You are required to create an account to access certain features of Helium.</p>
                    <p>You are responsible for maintaining the confidentiality of your login credentials.</p>
                    <p>You agree not to share your account, impersonate others, or provide false information.</p>
                    <p>You are liable for all activities conducted through your account.</p>
                  </li>
                  
                  <li>
                    <strong>License and Acceptable Use</strong>
                    <p>We grant you a limited, non-exclusive, non-transferable license to use Helium for business or personal purposes in accordance with these Terms.</p>
                    <p>You must not reverse engineer, copy, or redistribute our software.</p>
                    <p>You must not use Helium for unlawful, harmful, or fraudulent purposes.</p>
                    <p>You must not interfere with the security, availability, or performance of the Services.</p>
                  </li>
                  
                  <li>
                    <strong>Subscription, Credits, and Payment</strong>
                    <p>Helium offers two pricing models: prepaid credits and pay-as-you-go (PAYG) usage.</p>
                    <p>Payments must be made in accordance with the plan you select.</p>
                    <p>Credits are non-refundable except where required by law.</p>
                  </li>
                  
                  <li>
                    <strong>Data and Content</strong>
                    <p>You retain ownership of the data and content you provide to Helium.</p>
                    <p>By using our Services, you grant us a license to process, analyze, and store your data solely for providing and improving the Services.</p>
                    <p>You are responsible for ensuring that your data does not violate any laws or third-party rights.</p>
                  </li>
                  
                  <li>
                    <strong>Confidentiality and Security</strong>
                    <p>We implement industry-standard security practices to protect your data. However, you acknowledge that no system is fully secure. You agree to notify us immediately of any unauthorized access to your account.</p>
                  </li>
                  
                  <li>
                    <strong>Intellectual Property</strong>
                    <p>All intellectual property rights in Helium, including trademarks, software, and content, belong to Neural Arc Inc. Unauthorized use is strictly prohibited.</p>
                  </li>
                  
                  <li>
                    <strong>Third-Party Services and Integrations</strong>
                    <p>Helium integrates with third-party applications. We are not responsible for the content, security, or practices of these third parties. Your use of such services is subject to their own terms and policies.</p>
                  </li>
                  
                  <li>
                    <strong>Disclaimers and Limitation of Liability</strong>
                    <p>Helium is provided 'as is' without warranties of any kind.</p>
                    <p>We do not guarantee uninterrupted, error-free, or completely secure operation.</p>
                    <p>To the fullest extent permitted by law, Neural Arc Inc. shall not be liable for any indirect, incidental, or consequential damages arising from your use of Helium.</p>
                  </li>
                  
                  <li>
                    <strong>Termination</strong>
                    <p>We may suspend or terminate your access to Helium if you violate these Terms. You may also discontinue use of Helium at any time.</p>
                  </li>
                  
                  <li>
                    <strong>Governing Law and Dispute Resolution</strong>
                    <p>These Terms are governed by the laws of the State of Delaware, United States. Any disputes shall be resolved through binding arbitration or courts located in Delaware, unless otherwise required by applicable law.</p>
                  </li>
                  
                  <li>
                    <strong>Modifications</strong>
                    <p>We may revise these Terms from time to time. Continued use of Helium after changes take effect constitutes acceptance of the revised Terms.</p>
                  </li>
                </ol>
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
        </div>
      </section>
    </main>
  );
}