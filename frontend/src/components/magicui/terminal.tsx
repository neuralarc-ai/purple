"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TerminalProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export function Terminal({ children, className, title = "bash" }: TerminalProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-neutral-900/90 text-white shadow-2xl backdrop-blur",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 md:px-6 md:py-3.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-white/60">{title}</span>
      </div>
      <div className="px-5 py-6 md:px-6 md:py-7 lg:px-8 lg:py-8">
        {children}
      </div>
    </div>
  );
}

export default Terminal;


