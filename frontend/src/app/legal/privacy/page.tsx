'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            Privacy <span className="text-secondary">Policy</span>
          </h1>
        </div>

        <div className="rounded-xl border border-border bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] p-8 shadow-sm">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-sm text-muted-foreground mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <ol className="list-decimal pl-5 space-y-4 text-muted-foreground">
              <li>
                <strong>Information We Collect</strong>
                <p>Personal Data: Name, email, company, contact details.</p>
                <p>Technical Data: IP address, browser type, device identifiers, usage logs.</p>
                <p>Cookies: We use cookies for analytics and personalization.</p>
              </li>
              
              <li>
                <strong>Use of Information</strong>
                <p>We use the information to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Provide, maintain, and improve our Services;</li>
                  <li>Process transactions and communicate with you;</li>
                  <li>Monitor usage trends and enhance security;</li>
                  <li>Comply with legal obligations.</li>
                </ul>
              </li>
              
              <li>
                <strong>Legal Basis for Processing</strong>
                <p>Where applicable, we process your data on the basis of your consent, our contractual obligations, compliance with legal obligations, or legitimate interests.</p>
              </li>
              
              <li>
                <strong>Data Sharing</strong>
                <p>We do not sell or rent your data. We may share it with:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Authorized service providers (under strict confidentiality);</li>
                  <li>Legal or regulatory authorities, when required;</li>
                  <li>Affiliates and successors in interest, in the event of a business transfer.</li>
                </ul>
              </li>
              
              <li>
                <strong>Data Retention</strong>
                <p>We retain your data only as long as necessary to fulfill the purposes outlined in this Policy, unless a longer retention period is required by law.</p>
              </li>
              
              <li>
                <strong>Security</strong>
                <p>We implement appropriate administrative, technical, and physical safeguards to protect your information against unauthorized access or disclosure.</p>
              </li>
              
              <li>
                <strong>Your Rights</strong>
                <p>Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict the processing of your data. Please contact us at support@he2.ai.</p>
              </li>
              
              <li>
                <strong>International Transfers</strong>
                <p>If your data is transferred outside of India, we ensure appropriate safeguards are in place, including data processing agreements and, where applicable, standard contractual clauses.</p>
              </li>
              
              <li>
                <strong>Changes</strong>
                <p>We may update this Privacy Policy periodically. We encourage you to review this page regularly.</p>
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