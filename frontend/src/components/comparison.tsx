"use client";

import React from "react";
import { cn } from "@/lib/utils";
import ComparisonPopup from "@/components/comparison-popup";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type ComparisonProps = {
  className?: string;
};

export default function Comparison({ className }: ComparisonProps) {
  const comparisonData = [
    {
      title: "Helium / Claude",
      videoSrc: "https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=Claude_edited_h77pso&profile=cld-default",
      docs: [
        {
          label: "Claude Doc",
          url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Claude/Claude%20-%20AI%20CRM%20Enterprise%20Transformation%20Roadmap_%2012-Month%20Implementation%20Plan.pdf",
        },
        {
          label: "Helium Doc",
          url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Claude/Helium%20-%20AI_crm_enterprise_roadmap.pdf",
        },
      ],
      facts: [
        "Claude created 11 pages; Helium produced 27 pages with structured depth.",
        "Helium maps features to business outcomes and revenue impact automatically.",
      ],
      prompt: "Design a 12-month product roadmap for an AI-powered CRM that's transitioning from freemium to enterprise. Include: feature prioritization framework, technical debt management, API development strategy, enterprise security requirements, pricing tier restructuring, competitive differentiation tactics, and user adoption metrics. Map features to business outcomes and revenue impact."
    },
    {
      title: "Helium / GPT",
      videoSrc: "https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=Gpt_edited_at36nt&profile=cld-default",
      docs: [
        {
          label: "GPT Doc",
          url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Gpt/GPT-Doc.pdf",
        },
        {
          label: "Helium Doc",
          url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Gpt/market_entry_strategy_analysis.pdf",
        },
      ],
      facts: [
        "GPT is faster but often delivers surface-level outputs versus Helium's rich deliverables.",
        "Helium provides decision-ready structures (KPIs, phased roadmaps) that GPT typically omits.",
      ],
      prompt: "Conduct comprehensive research on entering the European AI regulation compliance software market and produce a detailed market entry strategy document. Include: market sizing visualizations, regulatory landscape mapping, competitive analysis matrices, go-to-market timeline charts, resource allocation diagrams, revenue projection models, partnership ecosystem maps, and risk mitigation frameworks."
    },
    {
      title: "Helium / Claude",
      videoSrc: "https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=MotionR_scv4ps&profile=cld-default",
      docs: [
        {
          label: "Claude Doc",
          url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/Claude-MotionR%20Christmas%202024%20Launch%20Strategy_%20Smart%20Ring%20Market%20Analysis%20and%20Go-to-Market%20Plan.pdf",
        },
        {
          label: "Helium Suite",
          url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Helium-Claude%20Promo/Helium-MotionR.zip",
        },
      ],
      facts: [
        "Claude provided one comprehensive document with market analysis and strategy.",
        "Helium delivered deep analysis with 7 detailed files covering competitive analysis, budget recommendations, deliverables summary, GTM strategy, social media calendar, and strategic recommendations. And created a webpage too below is link",
      ],
      prompt: "I am launching \"MotionR\"my fitness ring product (currently priced at $499 + $20/month subscription) for Christmas 2024 in US/UK markets. Research current holiday fitness/health sentiment and analyze competitors (Oura Ring, Samsung Galaxy Ring, RingConn, Ultrahuman Ring Air, etc.) including their pricing, features, and Christmas marketing strategies."
    },
    {
      title: "Helium / Genspark",
      videoSrc: "https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=GenSpark-Helium_wqfqea&profile=cld-default",
      docs: [
        {
          label: "Genspark Doc",
          url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Genspark/GenSpark-AI%20Governance%20Compliance%20Handbook%20for%20Enterprise%20Leadership.pdf",
        },
        {
          label: "Helium - Complete Documentation Suite",
          url: "https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/files/Genspark/AI_Governance_Compliance_Handbook_Complete.zip",
        },
      ],
      facts: [
        "Genspark created a comprehensive handbook with good regulatory coverage and analysis.",
        "Helium delivered deep analysis with specialized documentation including compliance handbooks and executive summaries - providing actionable tools beyond just basic documentation.",
        "To view all files in detail with CSV and documentation, download the complete ZIP file.",
      ],
      prompt: "Research AI governance regulations across major markets (US, EU, APAC) and create a comprehensive compliance handbook document. Include: regulatory landscape mapping, compliance requirement matrices, implementation timeline charts, cost impact assessments, vendor evaluation frameworks, audit preparation checklists, risk mitigation strategies, and policy template libraries."
    },
    {
      title: "Helium / Lovable",
      videoSrc: "https://player.cloudinary.com/embed/?cloud_name=dye9sdxn9&public_id=TaskMonk_demo&profile=cld-default",
      imageSrc: "/home/Lovable.png",
      docs: [
        {
          label: "Lovable",
          url: "https://monk-task-flow.lovable.app",
        },
        {
          label: "Helium",
          url: "https://8080-4d158702-177d-4294-ad31-3089b936b97d.proxy.daytona.works/task-monk/index.html",
        },
      ],
      facts: [
        "Helium created a fully functional Task Monk app with dark theme and responsive design.",
        "Built with MonoScript font and simple outline icons as requested.",
      ],
      prompt: "Create me a clone app of taskade.com. This app will be called \"Task Monk\" Needs to be fully functional and with all the necessary features. Create dummy login \"admin\" and password \"123456\" Use Dark theme that is black and white with simple outline icons Font MonoScript or Similar Has to be responsive and interactive Build this app along with a landing page that will be sticky and encourage people to login"
    }
  ];

  return (
    <section className={cn("w-full px-4 md:px-8 lg:px-12 py-8 md:py-16 mt-12 md:mt-12", className)}>
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl md:text-5xl font-bold tracking-tight text-white mb-8 md:mb-10">
          Benchmarking Brilliance:<br />
          Helium vs. ChatGPT, Claude, GenSpark and Lovable
        </h2>

        <div className="text-white mb-8 md:mb-10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="mb-4">
              We put Helium to the test against four of the most popular AI tools businesses use across the globe: ChatGPT-5, Claude Sonnet-4, GenSpark AI and Loveable. Each platform was given the exact same prompt, and their outputs were evaluated for depth, accuracy, and real-world business relevance.
            </p>
            <p>
              Below, you will find a side-by-side video comparison along with the resulting documents, enabling you to decide which solution delivers the most powerful and actionable insights for enterprises.
            </p>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {comparisonData.map((item, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 flex justify-center">
                  <div className="h-[700px] w-full flex justify-center">
                    <ComparisonPopup
                      title={item.title}
                      videoSrc={item.videoSrc}
                      imageSrc={item.imageSrc}
                      docs={item.docs}
                      facts={item.facts}
                      prompt={item.prompt}
                      className="h-full max-w-[350px] md:max-w-[400px] lg:max-w-[900px]"
                    />
                  </div>
                </CarouselItem>

              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 md:left-8 w-12 h-12 bg-black hover:bg-gray-900 text-white border border-neutral-600 rounded-full flex items-center justify-center transition-colors" />
            <CarouselNext className="right-4 md:right-8 w-12 h-12 bg-black hover:bg-gray-900 text-white border border-neutral-600 rounded-full flex items-center justify-center transition-colors" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}