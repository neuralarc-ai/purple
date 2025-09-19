"use client";

import React from "react";
import { cn } from "@/lib/utils";
import ComparisonPopup from "@/components/comparison-popup";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();

  const comparisonData = [
    {
      title: t.benchmarking.comparisons.helium_claude_1.title,
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
      facts: t.benchmarking.comparisons.helium_claude_1.facts,
      prompt: t.benchmarking.comparisons.helium_claude_1.prompt
    },
    {
      title: t.benchmarking.comparisons.helium_gpt.title,
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
      facts: t.benchmarking.comparisons.helium_gpt.facts,
      prompt: t.benchmarking.comparisons.helium_gpt.prompt
    },
    {
      title: t.benchmarking.comparisons.helium_claude_2.title,
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
      facts: t.benchmarking.comparisons.helium_claude_2.facts,
      prompt: t.benchmarking.comparisons.helium_claude_2.prompt
    },
    {
      title: t.benchmarking.comparisons.helium_genspark.title,
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
      facts: t.benchmarking.comparisons.helium_genspark.facts,
      prompt: t.benchmarking.comparisons.helium_genspark.prompt
    },
    {
      title: t.benchmarking.comparisons.helium_lovable.title,
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
      facts: t.benchmarking.comparisons.helium_lovable.facts,
      prompt: t.benchmarking.comparisons.helium_lovable.prompt
    }
  ];

  return (
    <section className={cn("w-full px-4 md:px-8 lg:px-12 py-8 md:py-16 mt-12 md:mt-12", className)}>
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl md:text-5xl font-bold tracking-tight text-white mb-8 md:mb-10">
          {t.benchmarking.title}<br />
          {t.benchmarking.subtitle}
        </h2>

        <div className="text-white mb-8 md:mb-10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="mb-4">
              {t.benchmarking.description_1}
            </p>
            <p>
              {t.benchmarking.description_2}
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