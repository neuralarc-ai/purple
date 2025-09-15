"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import ComparisonPopup from "@/components/comparison-popup";

type ComparisonProps = {
  className?: string;
};

export default function Comparison({ className }: ComparisonProps) {
  const [showClaude, setShowClaude] = useState(false);
  const [showGpt, setShowGpt] = useState(false);
  const [showMotionR, setShowMotionR] = useState(false);
  const [showGenspark, setShowGenspark] = useState(false);

  // Prevent background scrolling when any popup is open
  useEffect(() => {
    const isAnyPopupOpen = showClaude || showGpt || showMotionR || showGenspark;
    
    if (isAnyPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showClaude, showGpt, showMotionR, showGenspark]);

  return (
    <section className={cn("w-full px-4 md:px-8 lg:px-12 py-8 md:py-16 md:mb-12", className)}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl md:text-4xl font-bold tracking-tight text-white mb-8 md:mb-10">
          See Helium in Action..
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card onClick={() => setShowClaude(true)} imageSrc="/home/file-creation.png">
            <div className="flex h-full">
              <div className="w-1/3 flex-shrink-0">
                <img src="/home/file-creation.png" alt="File Creation" className="w-full h-full object-cover rounded-l-2xl" />
              </div>
              <div className="w-2/3 px-6 py-6 flex flex-col justify-center">
                <div className="text-xs md:text-sm text-white/90 leading-tight mb-3">
                  Design a 12-month product roadmap for an AI-powered CRM transitioning from freemium to enterprise. Include: feature prioritization, technical debt management, API strategy, security requirements, pricing restructuring, competitive tactics, and user metrics.
                </div>
                <div className="text-lg md:text-xl font-bold text-white">VS</div>
                <div className="text-sm md:text-base font-semibold text-blue-300 mt-1">Claude</div>
                <div className="text-xs text-white/70 mt-1">(Analysis)</div>
              </div>
            </div>
          </Card>
          <Card onClick={() => setShowGpt(true)} imageSrc="/home/web-search.png">
            <div className="flex h-full">
              <div className="w-1/3 flex-shrink-0">
                <img src="/home/autonomous-task.png" alt="Web Search" className="w-full h-full object-cover rounded-l-2xl" />
              </div>
              <div className="w-2/3 px-6 py-6 flex flex-col justify-center">
                <div className="text-xs md:text-sm text-white/90 leading-tight mb-3">
                  Research European AI regulation compliance software market entry. Include: market sizing, regulatory mapping, competitive analysis, go-to-market timeline, resource allocation, revenue models, partnership maps, and risk frameworks.
                </div>
                <div className="text-lg md:text-xl font-bold text-white">VS</div>
                <div className="text-sm md:text-base font-semibold text-blue-300 mt-1">GPT</div>
                <div className="text-xs text-white/70 mt-1">(Research Analysis)</div>
              </div>
            </div>
          </Card>
          <Card onClick={() => setShowMotionR(true)} imageSrc="/home/browser-automation.png">
            <div className="flex h-full">
              <div className="w-1/3 flex-shrink-0">
                <img src="/home/browser-automation.png" alt="Browser Automation" className="w-full h-full object-cover rounded-l-2xl" />
              </div>
              <div className="w-2/3 px-6 py-6 flex flex-col justify-center">
                <div className="text-xs md:text-sm text-white/90 leading-tight mb-3">
                  Launch "MotionR" fitness ring ($499 + $20/month) for Christmas 2024 in US/UK. Research competitors (Oura, Samsung Galaxy Ring, RingConn, Ultrahuman), analyze pricing/features, recommend pricing strategy, go-to-market plan, landing page copy, email sequences, social media calendar, and promotional webpage.
                </div>
                <div className="text-lg md:text-xl font-bold text-white">VS</div>
                <div className="text-sm md:text-base font-semibold text-blue-300 mt-1">Claude</div>
                <div className="text-xs text-white/70 mt-1">(Webpage)</div>
              </div>
            </div>
          </Card>
          <Card onClick={() => setShowGenspark(true)} imageSrc="/home/automation.png">
            <div className="flex h-full">
              <div className="w-1/3 flex-shrink-0">
                <img src="/home/dashboard.png" alt="Automation" className="w-full h-full object-cover rounded-l-2xl" />
              </div>
              <div className="w-2/3 px-6 py-6 flex flex-col justify-center">
                <div className="text-xs md:text-sm text-white/90 leading-tight mb-3">
                  Research AI governance regulations across major markets (US, EU, APAC) and create a comprehensive compliance handbook document. Include: regulatory landscape mapping, compliance requirement matrices, implementation timeline charts, cost impact assessments, vendor evaluation frameworks, audit preparation checklists, risk mitigation strategies, and policy template libraries.
                </div>
                <div className="text-lg md:text-xl font-bold text-white">VS</div>
                <div className="text-sm md:text-base font-semibold text-blue-300 mt-1">Genspark</div>
                <div className="text-xs text-white/70 mt-1">(Research Analysis)</div>
              </div>
            </div>
          </Card>
        </div>
        {showClaude && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowClaude(false)}
          >
            <div
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowClaude(false)}
                className="absolute -top-3 -right-3 z-10 rounded-full bg-white text-black hover:bg-gray-200 w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
                title="Close"
              >
                ×
              </button>
              <ComparisonPopup
                videoSrc="https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=Claude_edited_h77pso&profile=cld-default"
                docs={[
                  {
                    label: "Claude Doc",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Claude/Claude%20-%20AI%20CRM%20Enterprise%20Transformation%20Roadmap_%2012-Month%20Implementation%20Plan.pdf",
                  },
                  {
                    label: "Helium Doc",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Claude/Helium%20-%20AI_crm_enterprise_roadmap.pdf",
                  },
                ]}
                facts={[
                  "Claude created 11 pages; Helium produced 27 pages with structured depth.",
                  "Helium maps features to business outcomes and revenue impact automatically.",
                ]}
                prompt={
                  "Design a 12-month product roadmap for an AI-powered CRM that's transitioning from freemium to enterprise. Include: feature prioritization framework, technical debt management, API development strategy, enterprise security requirements, pricing tier restructuring, competitive differentiation tactics, and user adoption metrics. Map features to business outcomes and revenue impact."
                }
              />
            </div>
          </div>
        )}
        {showGpt && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowGpt(false)}
          >
            <div
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowGpt(false)}
                className="absolute -top-3 -right-3 z-10 rounded-full bg-white text-black hover:bg-gray-200 w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
                title="Close"
              >
                ×
              </button>
              <ComparisonPopup
                videoSrc="https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=Gpt_edited_at36nt&profile=cld-default"
                docs={[
                  {
                    label: "GPT Doc",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Gpt/GPT-Doc.pdf",
                  },
                  {
                    label: "Helium Doc",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Gpt/market_entry_strategy_analysis.pdf",
                  },
                ]}
                facts={[
                  "GPT is faster but often delivers surface-level outputs versus Helium’s rich deliverables.",
                  "Helium provides decision-ready structures (KPIs, phased roadmaps) that GPT typically omits.",
                ]}
                prompt={
                  "Conduct comprehensive research on entering the European AI regulation compliance software market and produce a detailed market entry strategy document. Include: market sizing visualizations, regulatory landscape mapping, competitive analysis matrices, go-to-market timeline charts, resource allocation diagrams, revenue projection models, partnership ecosystem maps, and risk mitigation frameworks. Create a professional document with executive dashboard summaries, detailed strategic recommendations, implementation roadmaps, and supporting visual evidence that could guide a 50M market expansion decision."
                }
              />
            </div>
          </div>
        )}
        {showMotionR && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowMotionR(false)}
          >
            <div
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMotionR(false)}
                className="absolute -top-3 -right-3 z-10 rounded-full bg-white text-black hover:bg-gray-200 w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
                title="Close"
              >
                ×
              </button>
              <ComparisonPopup
                videoSrc="https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=Promo_1_zwgtzj&profile=cld-default"
                docs={[
                  {
                    label: "Claude Doc",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/Claude-MotionR%20Christmas%202024%20Launch%20Strategy_%20Smart%20Ring%20Market%20Analysis%20and%20Go-to-Market%20Plan.pdf",
                  },
                  {
                    label: "Helium Suite",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/competitive_analysis_matrix.pdf",
                  },
                  {
                    label: "Budget Recommendations",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/motionr_budget_recommendations.pdf",
                  },
                  {
                    label: "Deliverables Summary",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/motionr_deliverables_summary.pdf",
                  },
                  {
                    label: "GTM Strategy",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/motionr_gtm_strategy.pdf",
                  },
                  {
                    label: "Social Media Calendar",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/motionr_social_media_calendar.pdf",
                  },
                  {
                    label: "Strategic Recommendations",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/motionr_strategic_recommendations.pdf",
                  },
                ]}
                facts={[
                  "Claude provided one comprehensive document with market analysis and strategy.",
                  "Helium delivered deep analysis with 7 detailed files covering competitive analysis, budget recommendations, deliverables summary, GTM strategy, social media calendar, and strategic recommendations.",
                  "View webpage created by Helium",
                ]}
                prompt={
                  "I am launching \"MotionR\"my fitness ring product (currently priced at $499 + $20/month subscription) for Christmas 2024 in US/UK markets. Research current holiday fitness/health sentiment and analyze competitors (Oura Ring, Samsung Galaxy Ring, RingConn, Ultrahuman Ring Air, etc.) including their pricing, features, and Christmas marketing strategies. Based on competitor analysis and holiday shopping sentiment, recommend: optimal pricing strategy for Christmas (should I adjust from $499?), subscription model optimization, product positioning against competitors, complete go-to-market strategy including landing page copy highlighting competitive advantages, email marketing sequence, social media content calendar with optimal posting times for all platforms, messaging framework addressing Christmas fitness/wellness emotions and New Year resolution psychology, and performance tracking KPIs. Include competitive differentiation strategy and why customers should choose my ring over Oura/Samsung. Provide everything needed for immediate execution with budget recommendations and timeline. Also design a promotional webpage for me to publish."
                }
              />
            </div>
          </div>
        )}
        {showGenspark && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowGenspark(false)}
          >
            <div
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowGenspark(false)}
                className="absolute -top-3 -right-3 z-10 rounded-full bg-white text-black hover:bg-gray-200 w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
                title="Close"
              >
                ×
              </button>
              <ComparisonPopup
                videoSrc="https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=GenSpark-Helium_wqfqea&profile=cld-default"
                docs={[
                  {
                    label: "Genspark Doc",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Genspark/GenSpark-AI%20Governance%20Compliance%20Handbook%20for%20Enterprise%20Leadership.pdf",
                  },
                  {
                    label: "Helium - Complete Documentation Suite",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Genspark/AI_Governance_Compliance_Handbook_Complete.zip",
                  },
                ]}
                facts={[
                  "Genspark created a comprehensive handbook with good regulatory coverage and analysis.",
                  "Helium delivered deep analysis with specialized documentation including compliance handbooks and executive summaries - providing actionable tools beyond just basic documentation.",
                  "To view all files in detail with CSV and documentation, download the complete ZIP file.",
                ]}
                prompt={
                  "Research AI governance regulations across major markets (US, EU, APAC) and create a comprehensive compliance handbook document. Include: regulatory landscape mapping, compliance requirement matrices, implementation timeline charts, cost impact assessments, vendor evaluation frameworks, audit preparation checklists, risk mitigation strategies, and policy template libraries. Format as a professional handbook with regulatory summaries, compliance roadmaps, implementation guides, budget planning tools, and monitoring frameworks suitable for legal and operations teams."
                }
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Card({ children, onClick, imageSrc }: { children: React.ReactNode; onClick?: () => void; imageSrc?: string }) {
  return (
    <button onClick={onClick} className="relative rounded-2xl border border-white/15 bg-neutral-900/80 text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] backdrop-blur p-0 flex items-stretch text-sm md:text-base font-semibold w-full hover:bg-neutral-900/90 transition-colors overflow-hidden cursor-pointer">
      <div className="absolute inset-0 rounded-2xl pointer-events-none [mask-image:radial-gradient(90%_90%_at_50%_50%,black,transparent)]" />
      {children}
    </button>
  );
}


