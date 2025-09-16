'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <>
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex items-center justify-center mb-10 relative">
          <Link
            href="/legal"
            className="absolute left-0 group border border-border/50 bg-background hover:bg-accent/20 hover:border-secondary/40 rounded-full text-sm h-8 px-3 flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
          >
            <ArrowLeft size={14} className="text-muted-foreground" />
            <span className="font-medium text-muted-foreground text-xs tracking-wide">
              Back
            </span>
          </Link>

          <h1 className="text-3xl md:text-4xl font-medium tracking-tighter text-center">
            Terms of <span className="text-secondary">Service</span>
          </h1>
        </div>

        <div className="rounded-xl border border-border bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] p-8 shadow-sm">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-sm text-muted-foreground mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <ol className="list-decimal pl-5 space-y-4 text-muted-foreground">
              <li>
                <strong>Eligibility and Account Responsibility</strong>
                <p>You must be at least 18 years of age and capable of entering into a legally binding contract to access or use the Services. You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account.</p>
              </li>
              
              <li>
                <strong>License to Use Services</strong>
                <p>Subject to your compliance with these Terms, Helium grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Services solely for your internal business purposes. You shall not use the Services to develop competing products or reverse engineer any aspect of the platform.</p>
              </li>
              
              <li>
                <strong>Prohibited Conduct</strong>
                <p>You shall not:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Use the Services in any manner that infringes any intellectual property or proprietary rights of any party;</li>
                  <li>Use or access the Services to violate any applicable law or regulation;</li>
                  <li>Introduce malware or harmful code, scrape data, or interfere with service functionality;</li>
                  <li>Misrepresent your identity or affiliation.</li>
                </ul>
              </li>
              
              <li>
                <strong>Ownership and Intellectual Property</strong>
                <p>All content, trademarks, and software associated with the Services are the exclusive property of Helium or its licensors. No rights are granted except as explicitly set forth herein.</p>
              </li>
              
              <li>
                <strong>Third-Party Integrations</strong>
                <p>The Services may contain links or integrations with third-party platforms. Helium is not responsible for the content, functionality, or privacy practices of such third parties.</p>
              </li>
              
              <li>
                <strong>Disclaimers</strong>
                <p>The Services are provided "as is" and "as available." Helium makes no warranties or representations, express or implied, regarding the Services, including but not limited to merchantability, fitness for a particular purpose, accuracy, or non-infringement.</p>
              </li>
              
              <li>
                <strong>Limitation of Liability</strong>
                <p>To the maximum extent permitted by applicable law, Helium shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits or revenue, arising from or related to your use of the Services.</p>
              </li>
              
              <li>
                <strong>Indemnification</strong>
                <p>You agree to indemnify, defend, and hold harmless Helium, its officers, directors, employees, and affiliates from any claim, demand, liability, or expense arising out of your breach of these Terms or violation of applicable law.</p>
              </li>
              
              <li>
                <strong>Governing Law and Jurisdiction</strong>
                <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra.</p>
              </li>
              
              <li>
                <strong>Changes</strong>
                <p>We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.</p>
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
    </>
  );
}