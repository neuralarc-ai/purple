import React from 'react';
import { Megaphone, Cog, Search, Users, Banknote, Headset } from 'lucide-react';
import { MagicCard } from '@/components/magicui/magic-card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Row {
  department: string;
  performance: string;
  savings: string;
  intelligence: string;
  efficiency: string;
}

export default function FeatureTable({ className }: { className?: string }) {
  const { t } = useLanguage();
  
  // Create rows data from translations
  const rows: Row[] = [
    {
      department: t.featureTable.departments.sales.name,
      performance: t.featureTable.departments.sales.performance,
      savings: t.featureTable.departments.sales.savings,
      intelligence: t.featureTable.departments.sales.intelligence,
      efficiency: t.featureTable.departments.sales.efficiency,
    },
    {
      department: t.featureTable.departments.operations.name,
      performance: t.featureTable.departments.operations.performance,
      savings: t.featureTable.departments.operations.savings,
      intelligence: t.featureTable.departments.operations.intelligence,
      efficiency: t.featureTable.departments.operations.efficiency,
    },
    {
      department: t.featureTable.departments.research.name,
      performance: t.featureTable.departments.research.performance,
      savings: t.featureTable.departments.research.savings,
      intelligence: t.featureTable.departments.research.intelligence,
      efficiency: t.featureTable.departments.research.efficiency,
    },
    {
      department: t.featureTable.departments.hr.name,
      performance: t.featureTable.departments.hr.performance,
      savings: t.featureTable.departments.hr.savings,
      intelligence: t.featureTable.departments.hr.intelligence,
      efficiency: t.featureTable.departments.hr.efficiency,
    },
    {
      department: t.featureTable.departments.finance.name,
      performance: t.featureTable.departments.finance.performance,
      savings: t.featureTable.departments.finance.savings,
      intelligence: t.featureTable.departments.finance.intelligence,
      efficiency: t.featureTable.departments.finance.efficiency,
    },
    {
      department: t.featureTable.departments.customer.name,
      performance: t.featureTable.departments.customer.performance,
      savings: t.featureTable.departments.customer.savings,
      intelligence: t.featureTable.departments.customer.intelligence,
      efficiency: t.featureTable.departments.customer.efficiency,
    },
  ];

  const getDepartmentIcon = (department: string) => {
    if (department.includes('Sales') || department.includes('Marketing') || department.includes('विक्री') || department.includes('Vertrieb') || department.includes('المبيعات') || department.includes('営業') || department.includes('销售')) return Megaphone;
    if (department.includes('Operations') || department.includes('ऑपरेशन्स') || department.includes('Betrieb') || department.includes('العمليات') || department.includes('オペレーション') || department.includes('运营')) return Cog;
    if (department.includes('Research') || department.includes('संशोधन') || department.includes('Forschung') || department.includes('البحث') || department.includes('リサーチ') || department.includes('研究')) return Search;
    if (department.includes('Human Resources') || department.includes('मानवी') || department.includes('Personalwesen') || department.includes('الموارد البشرية') || department.includes('人事') || department.includes('人力资源')) return Users;
    if (department.includes('Finance') || department.includes('फायनान्स') || department.includes('Finanzen') || department.includes('المالية') || department.includes('財務') || department.includes('财务')) return Banknote;
    if (department.includes('Customer Success') || department.includes('ग्राहक') || department.includes('Kundenerfolg') || department.includes('نجاح العملاء') || department.includes('カスタマー') || department.includes('客户成功')) return Headset;
    return Megaphone;
  };
  return (
    <section className={cn('w-full px-4 md:px-8 lg:px-12 bg-black text-white mt-12 md:mt-20', className)}>
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-muted-foreground mb-3 md:mb-6 text-base md:text-xl">
          {t.featureTable.description}
        </p>
        <h2 className="text-xl md:mt-12 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-center mb-6">
          {t.featureTable.title}
        </h2>
        {/* Mobile Card Layout */}
        <div className="block md:hidden space-y-4">
          {rows.map((row, idx) => {
            const Icon = getDepartmentIcon(row.department);
            return (
              <div key={row.department} className="relative border border-neutral-600 rounded-2xl overflow-hidden bg-black">
                <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-[var(--helium-blue)] via-[var(--helium-green)] to-[var(--helium-blue)]"></div>
                <div className="relative bg-black rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                    <span className="font-semibold text-white text-lg">{row.department}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-1">{t.featureTable.headers.performance}</div>
                      <div className="text-sm text-white/90">{row.performance}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-1">{t.featureTable.headers.savings}</div>
                      <div className="text-sm text-white/90">{row.savings}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-1">{t.featureTable.headers.intelligence}</div>
                      <div className="text-sm text-white/90">{row.intelligence}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-1">{t.featureTable.headers.efficiency}</div>
                      <div className="text-sm text-white/90">{row.efficiency}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <div className="relative border-1 border-neutral-600 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-[var(--helium-blue)] via-[var(--helium-green)] to-[var(--helium-blue)]"></div>
            <table className="relative w-full text-left text-sm md:text-base bg-black rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-neutral-800 text-white">
                <th className="sticky left-0 z-10 bg-neutral-800 px-6 py-2 font-bold w-[240px] md:w-[280px] border-l border-r border-white/20 rounded-tl-2xl">
                  {t.featureTable.headers.department}
                </th>
                <th className="px-6 py-2 font-bold border-r border-white/20">{t.featureTable.headers.performance}</th>
                <th className="px-6 py-2 font-bold border-r border-white/20">{t.featureTable.headers.savings}</th>
                <th className="px-6 py-2 font-bold border-r border-white/20">{t.featureTable.headers.intelligence}</th>
                <th className="px-6 py-2 font-bold rounded-tr-2xl">{t.featureTable.headers.efficiency}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.department} className={cn('border-b border-white/10', idx % 2 === 1 && 'bg-white/5')}>
                  <td className={cn('sticky left-0 z-10 bg-black px-6 py-2 text-white border-l border-r border-white/20', idx === rows.length - 1 && 'rounded-bl-2xl')}>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = getDepartmentIcon(row.department);
                        return <Icon className="h-5 w-5 text-white" aria-hidden="true" />;
                      })()}
                      <span className="font-semibold text-white">{row.department}</span>
                    </div>
                  </td>
                  <td className="px-6 py-2 text-white/90 border-r border-white/20">{row.performance}</td>
                  <td className="px-6 py-2 text-white/90 border-r border-white/20">{row.savings}</td>
                  <td className="px-6 py-2 text-white/90 border-r border-white/20">{row.intelligence}</td>
                  <td className="px-6 py-2 text-white/90">{row.efficiency}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </section>
  );
}
