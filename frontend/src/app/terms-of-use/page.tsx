
import React from 'react'
import Link from 'next/link'

export default function TermsOfUsePage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <Link 
                        href="/" 
                        className="inline-flex items-center px-4 py-2 bg-white text-black rounded-full hover:bg-gray-100 transition-all duration-300 font-medium hover:-translate-y-1 hover:shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M6 8L2 12L6 16"/>
                            <path d="M2 12H22"/>
                        </svg>
                        Back to Home
                    </Link>
                </div>
                
                <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>
                
                <div className="space-y-8 text-sm leading-relaxed">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">1. Eligibility and Account Responsibility</h2>
                        <p>You must be at least 18 years of age and capable of entering into a legally binding contract to access or use the Services. You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">2. License to Use Services</h2>
                        <p>Subject to your compliance with these Terms, Helium AI grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Services solely for your internal business purposes. You shall not use the Services to develop competing products or reverse engineer any aspect of the platform.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">3. Prohibited Conduct</h2>
                        <p>You shall not:</p>
                        <ul className="list-disc list-inside ml-6 space-y-2 mt-2">
                            <li>Use the Services in any manner that infringes any intellectual property or proprietary rights of any party;</li>
                            <li>Use or access the Services to violate any applicable law or regulation;</li>
                            <li>Introduce malware or harmful code, scrape data, or interfere with service functionality;</li>
                            <li>Misrepresent your identity or affiliation.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">4. Ownership and Intellectual Property</h2>
                        <p>All content, trademarks, and software associated with the Services are the exclusive property of Helium AI or its licensors. No rights are granted except as explicitly set forth herein.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">5. Third-Party Integrations</h2>
                        <p>The Services may contain links or integrations with third-party platforms. Helium AI is not responsible for the content, functionality, or privacy practices of such third parties.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">6. Disclaimers</h2>
                        <p>The Services are provided "as is" and "as available." Helium AI makes no warranties or representations, express or implied, regarding the Services, including but not limited to merchantability, fitness for a particular purpose, accuracy, or non-infringement.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
                        <p>To the maximum extent permitted by applicable law, Helium AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits or revenue, arising from or related to your use of the Services.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">8. Indemnification</h2>
                        <p>You agree to indemnify, defend, and hold harmless Helium AI, its officers, directors, employees, and affiliates from any claim, demand, liability, or expense arising out of your breach of these Terms or violation of applicable law.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">9. Governing Law and Jurisdiction</h2>
                        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">10. Changes</h2>
                        <p>We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
=======
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
                Terms of Use
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