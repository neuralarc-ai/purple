"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type Row = {
  feature: string;
  helium: React.ReactNode;
  google: React.ReactNode;
  openai: React.ReactNode;
  claude: React.ReactNode;
  perplexity: React.ReactNode;
};

export default function CompareTable({ className }: { className?: string }) {
  const { t } = useLanguage();

  const rows: Row[] = [
    {
      feature: t.comparison.features.pricing,
      helium: t.comparison.values.helium.pricing,
      google: t.comparison.values.google.pricing,
      openai: t.comparison.values.openai.pricing,
      claude: t.comparison.values.claude.pricing,
      perplexity: t.comparison.values.perplexity.pricing,
    },
    {
      feature: t.comparison.features.autonomousTaskExecution,
      helium: t.comparison.values.helium.autonomousTaskExecution,
      google: t.comparison.values.google.autonomousTaskExecution,
      openai: t.comparison.values.openai.autonomousTaskExecution,
      claude: t.comparison.values.claude.autonomousTaskExecution,
      perplexity: t.comparison.values.perplexity.autonomousTaskExecution,
    },
    {
      feature: t.comparison.features.appIntegrations,
      helium: t.comparison.values.helium.appIntegrations,
      google: t.comparison.values.google.appIntegrations,
      openai: t.comparison.values.openai.appIntegrations,
      claude: t.comparison.values.claude.appIntegrations,
      perplexity: t.comparison.values.perplexity.appIntegrations === "✗" ? (
        <div className="inline-flex items-center justify-center">
          <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
        </div>
      ) : t.comparison.values.perplexity.appIntegrations,
    },
    {
      feature: t.comparison.features.webBrowsingAutomation,
      helium: t.comparison.values.helium.webBrowsingAutomation,
      google: t.comparison.values.google.webBrowsingAutomation,
      openai: t.comparison.values.openai.webBrowsingAutomation,
      claude: t.comparison.values.claude.webBrowsingAutomation,
      perplexity: t.comparison.values.perplexity.webBrowsingAutomation,
    },
    {
      feature: t.comparison.features.fileCreationManagement,
      helium: t.comparison.values.helium.fileCreationManagement,
      google: t.comparison.values.google.fileCreationManagement,
      openai: t.comparison.values.openai.fileCreationManagement,
      claude: t.comparison.values.claude.fileCreationManagement,
      perplexity: t.comparison.values.perplexity.fileCreationManagement === "✗" ? (
        <div className="inline-flex items-center justify-center">
          <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
        </div>
      ) : t.comparison.values.perplexity.fileCreationManagement,
    },
    {
      feature: t.comparison.features.workflowAutomation,
      helium: t.comparison.values.helium.workflowAutomation === "✓" ? (
        <div className="inline-flex items-center justify-center">
          <Check className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        </div>
      ) : t.comparison.values.helium.workflowAutomation,
      google: t.comparison.values.google.workflowAutomation,
      openai: t.comparison.values.openai.workflowAutomation,
      claude: t.comparison.values.claude.workflowAutomation,
      perplexity: t.comparison.values.perplexity.workflowAutomation === "✗" ? (
        <div className="inline-flex items-center justify-center">
          <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
        </div>
      ) : t.comparison.values.perplexity.workflowAutomation,
    },
  ];
  return (
    <section className={cn('w-full py-12 md:py-18 bg-black text-white', className)}>
      <div className="mx-auto max-w-6xl space-y-8 md:space-y-10">
        <div className="text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            {t.comparison.title}
          </h2>
          <p className="mt-3 text-base md:text-lg lg:text-xl text-muted-foreground">
            {t.comparison.subtitle}
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
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">{t.comparison.companies.helium}</div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.helium}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">{t.comparison.companies.google}</div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.google}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">{t.comparison.companies.openai}</div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.openai}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">{t.comparison.companies.claude}</div>
                    <div className="text-sm text-white/90 text-center leading-relaxed">{row.claude}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-semibold text-white/80 mb-2 text-center">{t.comparison.companies.perplexity}</div>
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
            <table className="relative w-full text-left text-sm md:text-base bg-black rounded-2xl overflow-hidden table-fixed">
              <thead>
                <tr className="bg-neutral-800 text-white">
                  <th className="sticky left-0 z-10 bg-neutral-800 px-7 md:px-8 py-3 font-bold border-l border-r border-white/20 rounded-tl-2xl w-1/6">

                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold border-r border-white/20 bg-emerald-500/10 w-1/6">
                    <span className="text-lg md:text-xl font-bold text-white">{t.comparison.companies.helium}</span>
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold border-r border-white/20 w-1/6">
                    <span className="text-lg md:text-xl font-bold text-white">{t.comparison.companies.google}</span>
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold border-r border-white/20 w-1/6">
                    <span className="text-lg md:text-xl font-bold text-white">{t.comparison.companies.openai}</span>
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold border-r border-white/20 w-1/6">
                    <span className="text-lg md:text-xl font-bold text-white">{t.comparison.companies.claude}</span>
                  </th>
                  <th className="px-7 md:px-8 py-3 font-bold rounded-tr-2xl w-1/6">
                    <span className="text-lg md:text-xl font-bold text-white">{t.comparison.companies.perplexity}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.feature} className={cn('border-b border-white/10', idx % 2 === 1 && 'bg-white/5')}>
                    <td className={cn('sticky left-0 z-10 bg-black px-7 md:px-8 py-3 text-white border-l border-r border-white/20 w-1/6', idx === rows.length - 1 && 'rounded-bl-2xl')}>
                      <span className="font-medium">{row.feature}</span>
                    </td>
                    <td className="px-7 md:px-8 py-3 text-white bg-emerald-500/10 border-r border-white/20 w-1/6">
                      {row.helium}
                    </td>
                    <td className="px-7 md:px-8 py-3 text-white/90 border-r border-white/20 w-1/6">{row.google}</td>
                    <td className="px-7 md:px-8 py-3 text-white/90 border-r border-white/20 w-1/6">{row.openai}</td>
                    <td className="px-7 md:px-8 py-3 text-white/90 border-r border-white/20 w-1/6">{row.claude}</td>
                    <td className="px-7 md:px-8 py-3 text-white/90 w-1/6">{row.perplexity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <div className="max-w-6xl mx-auto px-2 md:px-4">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 leading-relaxed text-center">
              {t.comparison.description}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}



