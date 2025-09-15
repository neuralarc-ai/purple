"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type Row = {
  feature: string;
  helium: React.ReactNode;
  google: React.ReactNode;
  openai: React.ReactNode;
  claude: React.ReactNode;
  perplexity: React.ReactNode;
};

const rows: Row[] = [
  {
    feature: 'Autonomous Task Execution',
    helium: 'Full Automation',
    google: 'Chat / Assist Only',
    openai: 'Partial (Agents rolling out)',
    claude: 'Partial (Tool use only)',
    perplexity: 'Limited (Search/Q&A)',
  },
  {
    feature: 'App Integrations',
    helium: '100+ Integrations',
    google: 'Workspace Apps',
    openai: 'Growing (tools, plugins)',
    claude: 'Some API Integrations',
    perplexity: (
      <div className="inline-flex items-center justify-center">
        <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
      </div>
    ),
  },
  {
    feature: 'Web Browsing & Automation',
    helium: 'Full Browser Control',
    google: 'Basic / Limited',
    openai: 'Advanced (Computer Use)',
    claude: 'Limited Retrieval',
    perplexity: 'Real-time Search Only',
  },
  {
    feature: 'File Creation & Management',
    helium: 'Full Suite',
    google: 'Docs, Sheets, Drive',
    openai: 'Export / Limited Management',
    claude: 'Drafts via API',
    perplexity: (
      <div className="inline-flex items-center justify-center">
        <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
      </div>
    ),
  },
  {
    feature: 'Workflow Automation',
    helium: (
      <div className="inline-flex items-center justify-center">
        <Check className="h-5 w-5 text-emerald-400" aria-hidden="true" />
      </div>
    ),
    google: 'Workspace Smart Tasks',
    openai: 'Agents / Automation',
    claude: 'Partial Tool Workflows',
    perplexity: (
      <div className="inline-flex items-center justify-center">
        <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
      </div>
    ),
  },
];

export default function CompareTable({ className }: { className?: string }) {
  return (
    <section className={cn('w-full mt-12 md:mt-20 bg-black text-white', className)}>
      <div className="mx-auto max-w-6xl space-y-8 md:space-y-10">
        <div className="text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Why Choose One When You Can Have Everything?
          </h2>
          <p className="mt-3 text-base md:text-lg lg:text-xl text-muted-foreground">
            Helium AI vs. The Competition: The Complete Comparison
          </p>
        </div>
        {/* Mobile Card Layout */}
        <div className="block md:hidden space-y-4 px-2">
          {rows.map((row, idx) => (
            <div key={row.feature} className="relative border border-neutral-600 rounded-2xl overflow-hidden bg-black">
              <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-[var(--helium-blue)] via-[var(--helium-green)] to-[var(--helium-blue)]"></div>
              <div className="relative bg-black rounded-2xl p-5">
                <div className="font-medium text-white text-lg mb-5 text-center leading-tight">{row.feature}</div>
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 rounded-lg p-4">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center flex items-center justify-center gap-2">
                      Helium AI - PAYG
                      <div className="relative group">
                        <Info className="h-3 w-3 text-white/60 hover:text-white/80 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          pay-as-you-go
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.helium}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">Google - $20/month</div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.google}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">OpenAI - $20/month</div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.openai}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">Claude Pro - $20/month</div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.claude}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">Perplexity Pro - $20/month</div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.perplexity}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <div className="relative border-1 border-neutral-600 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-[var(--helium-blue)] via-[var(--helium-green)] to-[var(--helium-blue)]"></div>
            <table className="relative w-full text-left text-sm md:text-base bg-black rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-neutral-800 text-white">
                  <th className="sticky left-0 z-10 bg-neutral-800 px-7 md:px-8 py-3 font-bold w-[200px] md:w-[240px] border-l border-r border-white/20 rounded-tl-2xl">
                    Features
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold border-r border-white/20 bg-emerald-500/10">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm md:text-base font-medium">Helium AI</span>
                      <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-white flex items-center gap-2">
                        PAYG
                        <div className="relative group">
                          <Info className="h-3 w-3 text-white/60 hover:text-white/80 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            pay-as-you-go<br />
                            View Below Table for Details
                          </div>
                        </div>
                      </span>
                    </div>
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold border-r border-white/20">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm md:text-base font-medium">Google</span>
                      <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-white">$20/month</span>
                    </div>
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold border-r border-white/20">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm md:text-base font-medium">OpenAI</span>
                      <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-white">$20/month</span>
                    </div>
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold border-r border-white/20">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm md:text-base font-medium">Claude Pro</span>
                      <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-white">$20/month</span>
                    </div>
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold rounded-tr-2xl">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm md:text-base font-medium">Perplexity Pro</span>
                      <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-white">$20/month</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.feature} className={cn('border-b border-white/10', idx % 2 === 1 && 'bg-white/5')}>
                    <td className={cn('sticky left-0 z-10 bg-black px-7 md:px-8 py-3 text-white border-l border-r border-white/20', idx === rows.length - 1 && 'rounded-bl-2xl')}>
                      <span className="font-medium">{row.feature}</span>
                    </td>
                    <td className="px-7 md:px-8 py-3 text-white bg-emerald-500/10 border-r border-white/20">
                      {row.helium}
                    </td>
                    <td className="px-7 md:px-8 py-3 text-white/90 border-r border-white/20">{row.google}</td>
                    <td className="px-7 md:px-8 py-3 text-white/90 border-r border-white/20">{row.openai}</td>
                    <td className="px-7 md:px-8 py-3 text-white/90 border-r border-white/20">{row.claude}</td>
                    <td className="px-7 md:px-8 py-3 text-white/90">{row.perplexity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-8">
          <div className="max-w-4xl mx-auto">
             <p className="text-sm sm:text-base md:text-lg lg:text-xl sm:p-0 p-4 text-white/80 leading-relaxed">
              Most leading AI tools that businesses use across the globe operate on monthly subscription plans with limited tokens or credits, which often leads to underutilization or overages. Helium introduces an innovative pricing model designed for flexibility and cost efficiency. Businesses can choose a prepaid credit model, allowing them to purchase credits in advance and use them at their own pace, with the option to top up anytime. Alternatively, they can select the PAYG (Pay-As-You-Go) model, which ensures they pay only for what they actually use. This approach can reduce overall AI spend for enterprises by as much as 45-55 percent, making Helium a highly economical and scalable solution for modern businesses.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}



