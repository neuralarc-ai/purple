import React from 'react';
import { Megaphone, Cog, Search, Users, Banknote, Headset } from 'lucide-react';
import { MagicCard } from '@/components/magicui/magic-card';
import { cn } from '@/lib/utils';

interface Row {
  department: string;
  performance: string;
  savings: string;
  intelligence: string;
  efficiency: string;
}

const rows: Row[] = [
  {
    department: 'Sales & Marketing',
    performance: 'Automate lead research & competitor analysis',
    savings: 'Reduce prospecting time by 70%',
    intelligence: 'Instant market intelligence & campaign insights',
    efficiency: 'Generate collateral & proposals in minutes',
  },
  {
    department: 'Operations',
    performance: 'Simplify invoice handling and routine workflows',
    savings: 'Reduce time spent on manual admin tasks',
    intelligence: 'Track key metrics and resource usage in real time',
    efficiency: 'Support onboarding and compliance with automation',
  },
  {
    department: 'Research & Strategy',
    performance: 'Comprehensive market & competitive intelligence',
    savings: 'Replace expensive research subscriptions',
    intelligence: 'Up-to-minute industry data & trends',
    efficiency: 'Auto-generate strategic reports & dashboards',
  },
  {
    department: 'Human Resources',
    performance: 'Enhanced recruitment & performance management',
    savings: 'Reduce hiring costs & HR processing',
    intelligence: 'Live team productivity & engagement metrics',
    efficiency: 'Automate screening & employee communications',
  },
  {
    department: 'Finance & Analytics',
    performance: 'Accelerated reporting & forecasting accuracy',
    savings: 'Minimize accounting errors & data entry',
    intelligence: 'Live financial dashboards & cash flow',
    efficiency: 'Automate expense tracking & reconciliation',
  },
  {
    department: 'Customer Success',
    performance: 'Improved response times & satisfaction scores',
    savings: 'Reduce support staff while maintaining quality',
    intelligence: 'Instant customer health & churn risk indicators',
    efficiency: 'Automate ticket routing & follow-ups',
  },
];

export default function FeatureTable({ className }: { className?: string }) {
  const getDepartmentIcon = (department: string) => {
    if (department.startsWith('Sales')) return Megaphone;
    if (department.startsWith('Operations')) return Cog;
    if (department.startsWith('Research')) return Search;
    if (department.startsWith('Human Resources')) return Users;
    if (department.startsWith('Finance')) return Banknote;
    if (department.startsWith('Customer Success')) return Headset;
    return Megaphone;
  };
  return (
    <section className={cn('w-full px-4 md:px-8 lg:px-12 bg-black text-white mt-12 md:mt-20', className)}>
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-muted-foreground mb-3 md:mb-6 text-base md:text-xl">
          Stop paying for multiple subscriptions that force you to stitch together incomplete solutions. Helium AI delivers everything in one intelligent platform that actually executes tasks instead of just talking about them.
        </p>
        <h2 className="text-xl md:mt-12 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-center mb-6">
          What Can Helium Do for Your Business?
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
                      <div className="text-sm font-semibold text-white/80 mb-1">Performance Boost</div>
                      <div className="text-sm text-white/90">{row.performance}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-1">Cost Savings</div>
                      <div className="text-sm text-white/90">{row.savings}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-1">Real-Time Intelligence</div>
                      <div className="text-sm text-white/90">{row.intelligence}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-1">Efficiency Gains</div>
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
                  Department
                </th>
                <th className="px-6 py-2 font-bold border-r border-white/20">Performance Boost</th>
                <th className="px-6 py-2 font-bold border-r border-white/20">Cost Savings</th>
                <th className="px-6 py-2 font-bold border-r border-white/20">Real-Time Intelligence</th>
                <th className="px-6 py-2 font-bold rounded-tr-2xl">Efficiency Gains</th>
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
