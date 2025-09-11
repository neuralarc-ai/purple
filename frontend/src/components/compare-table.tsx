"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle } from 'lucide-react';

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
    google: 'Chat Only',
    openai: 'Chat Only',
    claude: 'Chat Only',
    perplexity: 'Limited Search',
  },
  {
    feature: 'App Integrations',
    helium: '100+ Integrations',
    google: 'None',
    openai: 'None',
    claude: 'API Only',
    perplexity: 'None',
  },
  {
    feature: 'Web Browsing & Automation',
    helium: 'Full Browser Control',
    google: 'Basic/ Limited',
    openai: 'Basic/ Limited',
    claude: 'None',
    perplexity: 'None',
  },
  {
    feature: 'File Creation & Management',
    helium: 'Full Suite',
    google: 'Basic Export',
    openai: (
      <div className="inline-flex items-center gap-1">
        <span>None</span>
        <AlertTriangle className="h-4 w-4 text-yellow-400" aria-hidden="true" />
      </div>
    ),
    claude: 'Basic Export',
    perplexity: 'None',
  },
  {
    feature: 'Workflow Automation',
    helium: (
      <div className="inline-flex items-center justify-center">
        <Check className="h-5 w-5 text-emerald-400" aria-hidden="true" />
      </div>
    ),
    google: (
      <div className="inline-flex items-center justify-center">
        <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
      </div>
    ),
    openai: (
      <div className="inline-flex items-center justify-center">
        <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
      </div>
    ),
    claude: (
      <div className="inline-flex items-center justify-center">
        <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
      </div>
    ),
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
        <div className="relative">
          <div className="relative rounded-2xl border border-white/20 overflow-hidden">
            <div className="relative overflow-x-auto px-2 md:px-4">
              <table className="w-full text-left text-sm md:text-base">
                <thead>
                  <tr className="bg-neutral-900 text-white">
                    <th className="sticky left-0 z-10 bg-neutral-900 backdrop-blur px-4 py-4 md:py-5 text-base md:text-lg font-extrabold w-[200px] md:w-[240px] border-b border-t border-r border-white/15 border-l rounded-tl-2xl">
                      Features
                    </th>
                    <th className="px-4 py-4 md:py-5 border-b border-t border-r border-white/15">
                      <div className="flex flex-col">
                        <span className="text-sm md:text-base font-medium">Helium AI</span>
                        <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-primary">$29/month</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 md:py-5 border-b border-t border-r border-white/15">
                      <div className="flex flex-col">
                        <span className="text-sm md:text-base font-medium">Google</span>
                        <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-primary/90">$20/month</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 md:py-5 border-b border-t border-r border-white/15">
                      <div className="flex flex-col">
                        <span className="text-sm md:text-base font-medium">OpenAI</span>
                        <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-primary/90">$20/month</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 md:py-5 border-b border-t border-r border-white/15">
                      <div className="flex flex-col">
                        <span className="text-sm md:text-base font-medium">Claude Pro</span>
                        <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-primary/90">$20/month</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 md:py-5 border-b border-t border-white/15 rounded-tr-2xl">
                      <div className="flex flex-col">
                        <span className="text-sm md:text-base font-medium">Perplexity</span>
                        <span className="leading-tight text-lg md:text-2xl lg:text-2xl font-extrabold text-primary/90">$20/month</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.feature} className={cn('border-b border-white/10', idx % 2 === 1 && 'bg-white/5')}>
                      <td className={cn('sticky left-0 z-10 bg-black backdrop-blur px-4 py-5 text-white border-x border-white/10', idx === rows.length - 1 && 'rounded-bl-2xl')}>
                        <span className="font-medium">{row.feature}</span>
                      </td>
                      <td className="px-4 py-5 text-white bg-emerald-500/10 border-x border-white/10">
                        {row.helium}
                      </td>
                      <td className="px-4 py-5 text-white/90 border-x border-white/10">{row.google}</td>
                      <td className="px-4 py-5 text-white/90 border-x border-white/10">{row.openai}</td>
                      <td className="px-4 py-5 text-white/90 border-x border-white/10">{row.claude}</td>
                      <td className="px-4 py-5 text-white/90 border-x border-white/10">{row.perplexity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



