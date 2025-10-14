import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion, useScroll, useTransform } from "motion/react";
import { useMemo, useRef } from "react";

interface ShowcaseProps {
  prefix?: string;
  items: string[];
  className?: string;
  /** Total scrollable height while pinned (in viewport heights). */
  pinHeightVh?: number;
  /** Visual spacing between lines in pixels. */
  lineHeightPx?: number;
}

export function Showcase({
  prefix,
  items,
  className,
  pinHeightVh = 220,
  lineHeightPx = 80,
}: ShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const count = items.length;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  // Map progress to fractional index [0, count - 1]
  const activeIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, Math.max(0, count - 1)],
  );
  // Convert to a translateY for the list so the focused item passes through the band
  const listY = useTransform(activeIndex, (v) => `${-v * lineHeightPx}px`);

  // Horizontal band mask centered vertically with height = lineHeightPx
  const maskStyles = useMemo(() => {
    const half = Math.round(lineHeightPx / 2);
    const mask = `linear-gradient(to bottom, transparent 0, transparent calc(50% - ${half}px), black calc(50% - ${half}px), black calc(50% + ${half}px), transparent calc(50% + ${half}px))`;
    return {
      WebkitMaskImage: mask,
      maskImage: mask,
    } as React.CSSProperties;
  }, [lineHeightPx]);

  return (
    <Section className={className}>
      <div ref={containerRef} style={{ minHeight: `${pinHeightVh}vh` }}>
        <div className="sticky top-[35vh]">
          <div className="relative mx-auto h-[40vh]">
            <div className="-translate-y-1/2 absolute inset-x-0 top-1/2">
              <div className="mx-auto max-w-6xl">
                <div
                  className="flex items-center gap-6"
                  style={{ lineHeight: `${lineHeightPx}px` }}
                >
                  {prefix ? (
                    <p className="shrink-0 text-left font-extrabold text-4xl tracking-tight md:text-7xl">
                      {prefix}
                    </p>
                  ) : null}

                  <div className="relative flex-1">
                    {/* Base gray list */}
                    <motion.div aria-hidden style={{ y: listY }}>
                      {items.map((text) => (
                        <p
                          className="font-extrabold text-4xl text-muted-foreground tracking-tight opacity-40 md:text-7xl"
                          key={`ghost-${text}`}
                          style={{ height: lineHeightPx }}
                        >
                          {text}
                        </p>
                      ))}
                    </motion.div>

                    {/* Focused band */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={maskStyles}
                    >
                      <motion.div style={{ y: listY }}>
                        {items.map((text) => (
                          <p
                            className="font-extrabold text-4xl tracking-tight md:text-7xl"
                            key={`focus-${text}`}
                            style={{ height: lineHeightPx }}
                          >
                            {text}
                          </p>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
