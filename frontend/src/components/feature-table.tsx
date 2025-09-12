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
    <section className={cn('w-full px-4 md:px-8 lg:px-12 bg-black text-white', className)}>
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-muted-foreground mb-3 md:mb-6 text-base md:text-xl">
          Stop paying for multiple subscriptions that force you to stitch together incomplete solutions. Helium AI delivers everything in one intelligent platform that actually executes tasks instead of just talking about them.
        </p>
        <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-center mb-6">
          What Can Helium Do for Your Business?
        </h2>
        <div className="relative rounded-2xl group">
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl p-[1.5px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:linear-gradient(135deg,var(--helium-blue),var(--helium-green))]" />
          <div aria-hidden className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-40 [background:radial-gradient(60%_60%_at_50%_50%,color-mix(in_oklab,var(--helium-blue)_60%,transparent)_0%,transparent_70%),radial-gradient(60%_60%_at_50%_50%,color-mix(in_oklab,var(--helium-green)_50%,transparent)_0%,transparent_70%)]" />
          <MagicCard className="relative rounded-2xl border border-white/10 transition-colors bg-black backdrop-blur overflow-hidden" gradientFrom="var(--helium-blue)" gradientTo="var(--helium-green)">
            <div className="relative overflow-x-auto px-2">
              <table className="w-full text-left text-sm md:text-base">
                <thead>
                  <tr className="bg-neutral-900 text-white">
                    <th className="sticky left-0 z-10 bg-black backdrop-blur px-4 py-4 md:py-5 font-bold w-[200px] md:w-[220px] border-b border-t border-r border-white/15 border-l rounded-tl-2xl">Department</th>
                    <th className="px-4 py-4 md:py-5 font-bold border-b border-t border-r border-white/15">Performance Boost</th>
                    <th className="px-4 py-4 md:py-5 font-bold border-b border-t border-r border-white/15">Cost Savings</th>
                    <th className="px-4 py-4 md:py-5 font-bold border-b border-t border-r border-white/15">Real-Time Intelligence</th>
                    <th className="px-4 py-4 md:py-5 font-bold border-b border-t border-white/15">Efficiency Gains</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.department} className={cn('border-b border-white/20', idx % 2 === 1 && 'bg-white/5')}>
                      <td className={cn('sticky left-0 z-10 bg-black backdrop-blur px-4 py-4 text-white border-x border-white/20', idx === rows.length - 1 && 'rounded-bl-2xl')}>
                        {(() => {
                          const Icon = getDepartmentIcon(row.department);
                          return (
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-white flex-shrink-0" aria-hidden="true" />
                              <span className="font-semibold">{row.department}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4 text-white/90 border-x border-white/20">{row.performance}</td>
                      <td className="px-4 py-4 text-white/90 border-x border-white/20">{row.savings}</td>
                      <td className="px-4 py-4 text-white/90 border-x border-white/20">{row.intelligence}</td>
                      <td className="px-4 py-4 text-white/90 border-x border-white/20">{row.efficiency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MagicCard>
        </div>
      </div>
    </section>
  );
}
