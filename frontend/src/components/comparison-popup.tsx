"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ComparisonPopupProps = {
  className?: string;
  docs?: { label: string; url: string }[];
  videoSrc: string;
  facts?: string[];
  prompt?: string;
  title?: string;
  imageSrc?: string;
  onClose?: () => void;
};

export default function ComparisonPopup({
  className,
  docs,
  videoSrc,
  facts,
  prompt,
  title = "Helium / Claude",
  imageSrc,
  onClose,
}: ComparisonPopupProps) {
  return (
    <section className={cn("w-full h-full", className)}>
      <div className="flex flex-col h-full rounded-2xl border border-black bg-neutral-900 text-white p-4">
        {/* Header */}
        <div className="relative mb-2">
          <h2 className="text-[16px] md:text-[20px] font-bold text-white line-clamp-1">
            {title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-0 right-0 text-white hover:text-gray-300 w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
              title="Close"
            >
              ×
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-6 flex-1 overflow-hidden">
          {/* Video Section - Top */}
          <div className="w-full flex items-center">
            <div className="rounded-xl overflow-hidden border border-white/10 h-[300px] md:h-[350px] w-full">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={`${title} Preview`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <iframe
                  src={videoSrc}
                  width="100%"
                  height="100%"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  frameBorder={0}
                />
              )}
            </div>
          </div>

          {/* Bottom Section - Prompt and Facts side by side */}
          <div className="flex flex-col md:flex-row gap-4 h-[200px]">
            {/* Prompt Section - Left */}
            <div className="w-full md:w-1/2 bg-white/5 rounded-lg relative">
              <div className="p-3 overflow-y-auto h-full">
                <h3 className="text-sm font-semibold text-white mb-2">Prompt:</h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  {prompt}
                </p>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Facts Section - Right */}
            <div className="w-full md:w-1/2 rounded-lg border border-white/10 bg-[#26FF0008] relative">
              <div className="p-3 overflow-y-auto h-full">
                <h3 className="text-sm font-semibold text-white mb-2">
                  Final Result Files:
                </h3>
                <div className="space-y-2">
                  {facts?.map((fact, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-white leading-relaxed mb-1">
                        {fact}
                      </p>
                      {docs && docs[idx] && (
                        <a
                          href={
                            title?.includes("Lovable") &&
                            docs[idx].label.includes("Helium")
                              ? "https://task-monk-demo.vercel.app"
                              : docs[idx].url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-300 hover:text-blue-200 underline"
                        >
                          {title?.includes("Lovable")
                            ? `View app created by ${
                                docs[idx].label.includes("Helium")
                                  ? "Helium"
                                  : docs[idx].label.split(" ")[0]
                              }`
                            : `View ${
                                title?.includes("Claude") &&
                                docs[idx].label.includes("Helium")
                                  ? "All Files in zip created by"
                                  : "File created by"
                              } ${
                                docs[idx].label.includes("Helium")
                                  ? "Helium"
                                  : docs[idx].label.split(" ")[0]
                              }`}
                        </a>
                      )}

                      {title?.includes("Claude") &&
                        docs &&
                        docs[idx] &&
                        docs[idx].label === "Helium Suite" && (
                          <div className="mt-1">
                            <a
                              href="https://motion-r.vercel.app"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-300 hover:text-blue-200 underline"
                            >
                              View webpage created by Helium
                            </a>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
