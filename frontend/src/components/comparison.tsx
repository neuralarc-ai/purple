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
  const [showTaskMonk, setShowTaskMonk] = useState(false);

  // Prevent background scrolling when any popup is open
  useEffect(() => {
    const isAnyPopupOpen = showClaude || showGpt || showMotionR || showGenspark || showTaskMonk;
    
    if (isAnyPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showClaude, showGpt, showMotionR, showGenspark, showTaskMonk]);

  return (
    <section className={cn("w-full px-4 md:px-8 lg:px-12 py-8 md:py-16 md:mb-12", className)}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl md:text-4xl font-bold tracking-tight text-white mb-8 md:mb-10">
          Benchmarking Brilliance:<br />
          Helium vs. ChatGPT, Claude, GenSpark and Lovable
        </h2>
        
        <div className="text-white mb-8 md:mb-10">
          <div className="max-w-4xl mx-auto">
            <p className="mb-4 text-justify">
              We put Helium to the test against four of the most popular AI tools businesses use across the globe: ChatGPT-5, Claude Sonnet-4, GenSpark AI and Loveable. Each platform was given the exact same prompt, and their outputs were evaluated for depth, accuracy, and real-world business relevance.
            </p>
            <p className="text-justify">
              Below, you will find a side-by-side video comparison along with the resulting documents, enabling you to decide which solution delivers the most powerful and actionable insights for enterprises.
            </p>
          </div>
        </div>
        
        {/* Top row - 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="w-full h-[240px] md:h-[260px]">
            <SimpleCard 
              title="Helium / Claude"
              prompt="Design a 12-month product roadmap for an AI-powered CRM that's transitioning from freemium to enterprise. Include: feature prioritization framework, technical debt management, API development strategy, enterprise security requirements, pricing tier restructuring, competitive differentiation tactics, and user adoption metrics. Map features to business outcomes and revenue impact."
              onClick={() => setShowClaude(true)}
            />
          </div>
          <div className="w-full h-[240px] md:h-[260px]">
            <SimpleCard 
              title="Helium / GPT"
              prompt="Conduct comprehensive research on entering the European AI regulation compliance software market and produce a detailed market entry strategy document. Include: market sizing visualizations, regulatory landscape mapping, competitive analysis matrices, go-to-market timeline charts, resource allocation diagrams, revenue projection models, partnership ecosystem maps, and risk mitigation frameworks."
              onClick={() => setShowGpt(true)}
            />
          </div>
          <div className="w-full h-[240px] md:h-[260px]">
            <SimpleCard 
              title="Helium / Claude"
              prompt="I am launching MotionR my fitness ring product (currently priced at $499 + $20/month subscription) for Christmas 2024 in US/UK markets. Research current holiday fitness/health sentiment and analyze competitors (Oura Ring, Samsung Galaxy Ring, RingConn, Ultrahuman Ring Air, etc.) including their pricing, features, and Christmas marketing strategies."
              onClick={() => setShowMotionR(true)}
            />
          </div>
        </div>

        {/* Bottom row - 2 centered cards */}
        <div className="flex justify-center gap-4 md:gap-6">
          <div className="w-full max-w-sm h-[240px] md:h-[260px]">
            <SimpleCard 
              title="Helium / Genspark"
              prompt="Research AI governance regulations across major markets (US, EU, APAC) and create a comprehensive compliance handbook document. Include: regulatory landscape mapping, compliance requirement matrices, implementation timeline charts, cost impact assessments, vendor evaluation frameworks, audit preparation checklists, risk mitigation strategies, and policy template libraries."
              onClick={() => setShowGenspark(true)}
            />
          </div>
          <div className="w-full max-w-sm h-[240px] md:h-[260px]">
            <SimpleCard 
              title="Helium / Lovable"
              prompt="Create me a clone app of taskade.com. This app will be called Task Monk Needs to be fully functional and with all the necessary features. Create dummy login admin and password 123456 Use Dark theme that is black and white with simple outline icons Font MonoScript or Similar Has to be responsive and interactive Build this app along with a landing page that will be sticky and encourage people to login"
              onClick={() => setShowTaskMonk(true)}
            />
          </div>
        </div>

        {/* Popups */}
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
                title="Helium / Claude"
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
                title="Helium / GPT"
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
                  "GPT is faster but often delivers surface-level outputs versus Helium's rich deliverables.",
                  "Helium provides decision-ready structures (KPIs, phased roadmaps) that GPT typically omits.",
                ]}
                prompt={
                  "Conduct comprehensive research on entering the European AI regulation compliance software market and produce a detailed market entry strategy document. Include: market sizing visualizations, regulatory landscape mapping, competitive analysis matrices, go-to-market timeline charts, resource allocation diagrams, revenue projection models, partnership ecosystem maps, and risk mitigation frameworks."
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
                title="Helium / Claude"
                videoSrc="https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=MotionR_scv4ps&profile=cld-default"
                docs={[
                  {
                    label: "Claude Doc",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/Claude-MotionR%20Christmas%202024%20Launch%20Strategy_%20Smart%20Ring%20Market%20Analysis%20and%20Go-to-Market%20Plan.pdf",
                  },
                  {
                    label: "Helium Suite",
                    url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/Helium-MotionR.zip",
                  },
                ]}
                facts={[
                  "Claude provided one comprehensive document with market analysis and strategy.",
                  "Helium delivered deep analysis with 7 detailed files covering competitive analysis, budget recommendations, deliverables summary, GTM strategy, social media calendar, and strategic recommendations. And created a webpage too below is link",
                
                ]}
                prompt={
                  "I am launching \"MotionR\"my fitness ring product (currently priced at $499 + $20/month subscription) for Christmas 2024 in US/UK markets. Research current holiday fitness/health sentiment and analyze competitors (Oura Ring, Samsung Galaxy Ring, RingConn, Ultrahuman Ring Air, etc.) including their pricing, features, and Christmas marketing strategies."
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
                title="Helium / Genspark"
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
                  "Research AI governance regulations across major markets (US, EU, APAC) and create a comprehensive compliance handbook document. Include: regulatory landscape mapping, compliance requirement matrices, implementation timeline charts, cost impact assessments, vendor evaluation frameworks, audit preparation checklists, risk mitigation strategies, and policy template libraries."
                }
              />
            </div>
          </div>
        )}

        {showTaskMonk && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowTaskMonk(false)}
          >
            <div
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowTaskMonk(false)}
                className="absolute -top-3 -right-3 z-10 rounded-full bg-white text-black hover:bg-gray-200 w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
                title="Close"
              >
                ×
              </button>
              <ComparisonPopup
                title="Helium / Lovable"
                videoSrc="https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=TaskMonk_demo&profile=cld-default"
                imageSrc="/home/Lovable.png"
                docs={[
                  {
                    label: "Lovable",
                    url: "https://monk-task-flow.lovable.app",
                  },
                  {
                    label: "Helium",
                    url: "https://8080-4d158702-177d-4294-ad31-3089b936b97d.proxy.daytona.works/task-monk/index.html",
                  },
                ]}
                facts={[
                  "Helium created a fully functional Task Monk app with dark theme and responsive design.",
                  "Built with MonoScript font and simple outline icons as requested.",
                ]}
                prompt={
                  "Create me a clone app of taskade.com. This app will be called \"Task Monk\" Needs to be fully functional and with all the necessary features. Create dummy login \"admin\" and password \"123456\" Use Dark theme that is black and white with simple outline icons Font MonoScript or Similar Has to be responsive and interactive Build this app along with a landing page that will be sticky and encourage people to login"
                }
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SimpleCard({ title, prompt, onClick }: { 
  title: string; 
  prompt: string; 
  onClick: () => void; 
}) {
  return (
    <div className="bg-neutral-900 rounded-[12px] p-4 h-full w-full flex flex-col border border-white/15">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      
      <div className="flex-1 mb-3 overflow-hidden">
        <div className="text-xs text-gray-400 mb-2">Prompt:</div>
        <p className="text-xs text-gray-300 leading-relaxed text-left line-clamp-6">
          {prompt}
        </p>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onClick}
          className="px-3 py-1 rounded-full bg-white hover:bg-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
          title="View Details"
        >
          <span className="text-xs font-medium text-gray-800">View Details</span>
          <svg 
            className="w-3 h-3 text-gray-800" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}