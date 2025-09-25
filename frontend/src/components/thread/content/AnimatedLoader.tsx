import React from 'react';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

interface AnimatedLoaderProps {
  className?: string;
}

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-start  ${className}`}>
      {/* Pulsating loader icon */}
      <div className="loader-small">
        <style jsx>{`
          .loader-small {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            margin-right: 8px;
            margin-bottom: 2px;
          }

          .loader-small:before,
          .loader-small:after {
            content: "";
            position: absolute;
            border-radius: 50%;
            animation: pulsOut 1.8s ease-in-out infinite;
            filter: drop-shadow(0 0 0.5rem oklch(0.5881 0.2118 306.32));
          }

          .loader-small:before {
            width: 100%;
            padding-bottom: 100%;
            box-shadow: inset 0 0 0 2px oklch(0.5881 0.2118 306.32);
            animation-name: pulsIn;
          }

          .loader-small:after {
            width: calc(100% - 4px);
            padding-bottom: calc(100% - 4px);
            box-shadow: 0 0 0 0 oklch(0.5881 0.2118 306.32);
          }

          @keyframes pulsIn {
            0% {
              box-shadow: inset 0 0 0 2px oklch(0.5881 0.2118 306.32);
              opacity: 1;
            }

            50%, 100% {
              box-shadow: inset 0 0 0 0 oklch(0.5881 0.2118 306.32);
              opacity: 0;
            }
          }

          @keyframes pulsOut {
            0%, 50% {
              box-shadow: 0 0 0 0 oklch(0.5881 0.2118 306.32);
              opacity: 0;
            }

            100% {
              box-shadow: 0 0 0 2px oklch(0.5881 0.2118 306.32);
              opacity: 1;
            }
          }
        `}</style>
      </div>
      
      <AnimatedShinyText 
        className="text-base font-semibold text-white"
        shimmerWidth={100}
      >
        <span>Adstitch</span>
      </AnimatedShinyText>
    </div>
  );
};
