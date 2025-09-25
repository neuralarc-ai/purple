import { ComponentPropsWithoutRef, CSSProperties, FC } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedShinyTextProps
  extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      className={cn(
        "relative",
        className,
      )}
      {...props}
    >
      {/* Base text with proper colors */}
      <span className="text-black dark:text-white">
        {children}
      </span>
      
      {/* Shimmer effect overlay */}
      <span
        style={
          {
            "--shiny-width": `${shimmerWidth}px`,
            backgroundImage: "linear-gradient(90deg, transparent calc(50% - 40px), transparent, oklch(0.5881 0.2118 306.32), transparent calc(50% + 40px))",
            backgroundSize: "300% 100%",
            backgroundPosition: "-200% center",
          } as CSSProperties
        }
        className="absolute inset-0 bg-clip-text bg-no-repeat text-transparent animate-shiny-text"
      >
        {children}
      </span>
    </span>
  );
};
