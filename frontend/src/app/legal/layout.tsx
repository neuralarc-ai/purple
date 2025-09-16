import { FlickeringGrid } from '@/components/home/ui/flickering-grid';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState, useEffect } from 'react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tablet = useMediaQuery('(max-width: 1024px)');
  const [mounted, setMounted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <section className="w-full relative overflow-hidden pb-20">
        <div className="relative flex flex-col items-center w-full px-6 pt-10">
          {/* Left side flickering grid with gradient fades - similar to hero section */}
          <div className="absolute left-0 top-0 h-[600px] w-1/3 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background z-10" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />

            {mounted && (
              <FlickeringGrid
                className="h-full w-full"
                squareSize={tablet ? 2 : 2.5}
                gridGap={tablet ? 2 : 2.5}
                color="var(--secondary)"
                maxOpacity={0.4}
                flickerChance={isScrolling ? 0.01 : 0.03}
              />
            )}
          </div>

          {/* Right side flickering grid with gradient fades */}
          <div className="absolute right-0 top-0 h-[600px] w-1/3 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background z-10" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />

            {mounted && (
              <FlickeringGrid
                className="h-full w-full"
                squareSize={tablet ? 2 : 2.5}
                gridGap={tablet ? 2 : 2.5}
                color="var(--secondary)"
                maxOpacity={0.4}
                flickerChance={isScrolling ? 0.01 : 0.03}
              />
            )}
          </div>

          {/* Center content background with rounded bottom */}
          <div className="absolute inset-x-1/4 top-0 h-[600px] -z-20 bg-background rounded-b-xl"></div>

          {children}
        </div>
      </section>
    </div>
  );
}