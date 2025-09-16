'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FlickeringGrid } from '@/components/home/ui/flickering-grid';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState, useEffect } from 'react';

export default function PrivacyPolicyPage() {
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
                Privacy Policy
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
                    <p>Neural Arc Inc. ("Company," "we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use Helium.</p>
                  </li>
                  
                  <li>
                    <strong>Information We Collect</strong>
                    <p>Account Information: Name, email address, company details, billing information.</p>
                    <p>Usage Data: Logs of activity, system interactions, and performance metrics.</p>
                    <p>Content Data: Inputs, documents, or files you upload for processing.</p>
                    <p>Device Information: IP address, browser type, operating system, and related metadata.</p>
                  </li>
                  
                  <li>
                    <strong>How We Use Your Information</strong>
                    <p>Provide and improve Helium's services.</p>
                    <p>Process transactions and manage billing.</p>
                    <p>Enhance user experience and develop new features.</p>
                    <p>Ensure system security, compliance, and fraud prevention.</p>
                    <p>Communicate updates, service notices, or promotional content (with your consent).</p>
                  </li>
                  
                  <li>
                    <strong>Data Ownership and Control</strong>
                    <p>You retain ownership of your data.</p>
                    <p>We do not sell or rent your personal information to third parties.</p>
                    <p>You may request data access, correction, or deletion by contacting us.</p>
                  </li>
                  
                  <li>
                    <strong>Data Sharing and Disclosure</strong>
                    <p>With service providers who help operate Helium (subject to confidentiality obligations).</p>
                    <p>To comply with legal requirements or enforceable governmental requests.</p>
                    <p>To protect the rights, safety, or property of Neural Arc Inc. or its users.</p>
                  </li>
                  
                  <li>
                    <strong>Cookies and Tracking</strong>
                    <p>Helium may use cookies and tracking technologies for analytics, performance monitoring, and personalization. You can manage cookie preferences through your browser settings.</p>
                  </li>
                  
                  <li>
                    <strong>Data Security</strong>
                    <p>We employ encryption, access controls, and monitoring systems to safeguard data. Despite these measures, no method of electronic transmission is fully secure. Users are encouraged to maintain strong passwords and exercise caution.</p>
                  </li>
                  
                  <li>
                    <strong>Data Retention</strong>
                    <p>We retain your data only as long as necessary to provide the Services or as required by law. Once retention periods expire, data is securely deleted or anonymized.</p>
                  </li>
                  
                  <li>
                    <strong>International Data Transfers</strong>
                    <p>If you access Helium from outside the United States, your data may be transferred to and processed in the United States or other jurisdictions with different data protection laws.</p>
                  </li>
                  
                  <li>
                    <strong>Children's Privacy</strong>
                    <p>Helium is not intended for individuals under the age of 18. We do not knowingly collect data from minors. If such data is discovered, it will be deleted immediately.</p>
                  </li>
                  
                  <li>
                    <strong>Your Rights</strong>
                    <p>Access and receive a copy of your personal data.</p>
                    <p>Correct inaccurate or incomplete information.</p>
                    <p>Request deletion of your personal data.</p>
                    <p>Object to or restrict processing.</p>
                    <p>Withdraw consent for processing (where applicable).</p>
                  </li>
                  
                  <li>
                    <strong>Updates to Privacy Policy</strong>
                    <p>We may revise this Privacy Policy periodically. Updates will be posted on our website with the effective date clearly stated.</p>
                  </li>
                  
                  <li>
                    <strong>Contact Information</strong>
                    <p>Neural Arc Inc.</p>
                    <p>300 Creek View Road, Suite 209</p>
                    <p>Newark, New Castle County, DE 19711</p>
                    <p>United States</p>
                    <p>Email: support@neuralarc.ai</p>
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