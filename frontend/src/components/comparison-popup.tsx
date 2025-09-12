"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

type ComparisonPopupProps = {
  className?: string;
  docs?: { label: string; url: string }[];
  videoSrc: string;
  facts?: string[];
  prompt?: string;
};

export default function ComparisonPopup({ className, docs, videoSrc, facts, prompt }: ComparisonPopupProps) {
  const [showAllDocs, setShowAllDocs] = useState(false);

  return (
    <section className={cn("w-full px-2 md:px-8 lg:px-12", className)}>
      <div className="mx-auto max-w-sm md:max-w-6xl">
        <div className="rounded-2xl border border-white/15 bg-neutral-900 text-white p-2 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="rounded-xl overflow-hidden border border-white/10 h-[200px] md:h-[360px] lg:h-[420px]">
              <iframe
               src={videoSrc}
                width="640"
                height="360"
                style={{ height: "100%", width: "100%" }}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                frameBorder={0}
              />
            </div>
            <div className="flex flex-col gap-2 md:gap-4">
              <div className="rounded-lg border border-white/10 bg-black/30 p-2 md:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold text-white">Documents</h5>
                  {docs && docs.length > 2 && (
                    <button
                      onClick={() => setShowAllDocs(true)}
                      className="text-xs text-blue-300 hover:text-blue-200 underline"
                    >
                      View All ({docs.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {docs?.slice(0, 2).map((d, i) => {
                    const isPdf = d.url.toLowerCase().endsWith(".pdf");
                    const isExcel = d.url.toLowerCase().endsWith(".xlsx") || d.url.toLowerCase().endsWith(".xls") || d.url.toLowerCase().endsWith(".csv");
                    const isZip = d.url.toLowerCase().endsWith(".zip");
                    const previewSrc = isPdf
                      ? d.url
                      : `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(d.url)}`;
                    const isHelium = d.label.toLowerCase().includes('helium') || d.label.toLowerCase().includes('budget') || d.label.toLowerCase().includes('deliverables') || d.label.toLowerCase().includes('gtm') || d.label.toLowerCase().includes('social') || d.label.toLowerCase().includes('strategic') || d.label.toLowerCase().includes('competitive');
                    return (
                      <div key={i} className={`rounded-lg border border-white/10 overflow-hidden ${isHelium ? 'bg-orange-500/20' : 'bg-black/40'}`}>
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="block group">
                          <div className="aspect-[4/3] w-full bg-black/60">
                            {isZip ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <div className="text-center text-white">
                                  <div className="text-2xl mb-2">📦</div>
                                  <div className="text-sm">ZIP Archive</div>
                                  <div className="text-xs text-gray-400 mt-1">Click to download</div>
                                </div>
                              </div>
                            ) : isExcel ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <div className="text-center text-white">
                                  <div className="text-2xl mb-2">📊</div>
                                  <div className="text-sm">Excel/CSV File</div>
                                  <div className="text-xs text-gray-400 mt-1">Click to open in Google Docs</div>
                                </div>
                              </div>
                            ) : (
                              <iframe src={previewSrc} className="w-full h-full" />
                            )}
                          </div>
                          <div className="p-2 text-xs text-blue-300 group-hover:text-blue-200 underline break-all leading-relaxed">
                            {isHelium ? 'Helium - ' : ''}{d.label}
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-2 md:p-4 text-white/90 text-xs md:text-sm leading-relaxed">
                {facts?.map((fact, idx) => (
                  <p key={idx} className={`${idx === 0 ? "" : "mt-2"} ${fact.includes("To view all files") || fact.includes("View webpage created by Helium") ? "font-bold" : ""}`}>
                    {fact.includes("View webpage created by Helium") ? (
                      <a 
                        href="https://8080-9e5fc17e-c392-4516-92cb-72ff98575d68.proxy.daytona.works/index.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 underline"
                      >
                        {fact}
                      </a>
                    ) : (
                      fact
                    )}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 md:mt-6">
            <h4 className="text-sm md:text-base font-semibold text-white">Prompt Used</h4>
            {prompt ? (
              <p className="mt-2 text-xs md:text-sm text-white/90 leading-relaxed max-h-32 md:max-h-none overflow-y-auto">{prompt}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* All Documents Modal */}
      {showAllDocs && docs && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowAllDocs(false)}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAllDocs(false)}
              className="hidden md:flex absolute -top-3 -right-3 z-10 rounded-full bg-white text-black hover:bg-gray-200 w-8 h-8 items-center justify-center text-lg font-bold transition-colors"
              title="Close"
            >
              ×
            </button>
            <div className="rounded-2xl border border-white/15 bg-neutral-900 text-white p-4">
              <h3 className="text-lg font-bold mb-3">All Documents</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {docs.map((d, i) => {
                  const isPdf = d.url.toLowerCase().endsWith(".pdf");
                  const isExcel = d.url.toLowerCase().endsWith(".xlsx") || d.url.toLowerCase().endsWith(".xls") || d.url.toLowerCase().endsWith(".csv");
                  const isZip = d.url.toLowerCase().endsWith(".zip");
                  const previewSrc = isPdf
                    ? d.url
                    : `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(d.url)}`;
                  const isHelium = d.label.toLowerCase().includes('helium') || d.label.toLowerCase().includes('budget') || d.label.toLowerCase().includes('deliverables') || d.label.toLowerCase().includes('gtm') || d.label.toLowerCase().includes('social') || d.label.toLowerCase().includes('strategic') || d.label.toLowerCase().includes('competitive') || d.label.toLowerCase().includes('compliance') || d.label.toLowerCase().includes('tracking') || d.label.toLowerCase().includes('executive') || d.label.toLowerCase().includes('calculator');
                  return (
                    <div key={i} className={`rounded-lg border border-white/10 overflow-hidden ${isHelium ? 'bg-orange-500/20' : 'bg-black/40'}`}>
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="block group">
                        <div className="aspect-[4/3] w-full bg-black/60">
                          {isZip ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <div className="text-center text-white">
                                <div className="text-2xl mb-2">📦</div>
                                <div className="text-sm">ZIP Archive</div>
                                <div className="text-xs text-gray-400 mt-1">Click to download</div>
                              </div>
                            </div>
                          ) : isExcel ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <div className="text-center text-white">
                                <div className="text-2xl mb-2">📊</div>
                                <div className="text-sm">Excel/CSV File</div>
                                <div className="text-xs text-gray-400 mt-1">Click to open in Google Docs</div>
                              </div>
                            </div>
                          ) : (
                            <iframe src={previewSrc} className="w-full h-full" />
                          )}
                        </div>
                        <div className="p-2 text-xs text-blue-300 group-hover:text-blue-200 underline break-all">
                          {isHelium ? 'Helium - ' : ''}{d.label}
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


