import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { buttonVariants } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ONBOARD_LINK } from "./constants";

const CrowdCanvas = lazy(() =>
  import("@rectangular-labs/ui/components/background/crowd").then((m) => ({
    default: m.CrowdCanvas,
  })),
);

const mockChips = [
  "Audience: in-house teams",
  "Stance: decisive",
  "Goal: demand capture",
];

export const Hero = () => {
  const [titleIndex, setTitleIndex] = useState(0);
  const titles = useMemo(() => ["traffic", "leads", "sales"], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length);
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, [titles.length]);

  return (
    <div className="relative min-h-screen w-full lg:min-h-[calc(100vh-70px)]">
      <Section className="relative z-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[7fr,5fr]">
          <div className="space-y-6">
            <h1 className="font-regular text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
              <span>Turn your marketing strategy into ranked pages — </span>
              <span className="inline-flex overflow-hidden align-bottom">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={titles[titleIndex]}
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -32 }}
                    transition={{ type: "spring", stiffness: 60, damping: 12 }}
                    className="inline-block font-semibold"
                  >
                    {titles[titleIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span> fast.</span>
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Connect your data, explain your strategy, and watch it turn into
              published, ranked content.
            </p>
            <a
              className={buttonVariants({
                className: "gap-3",
                size: "lg",
              })}
              href={ONBOARD_LINK}
              rel="noopener"
              target="_blank"
            >
              Sign up today <MoveRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative w-full">
            <div className="space-y-4 rounded-3xl border border-border bg-background/70 p-6 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between text-muted-foreground text-sm uppercase tracking-[0.3em]">
                <span>Chat connected to Google Search Console</span>
                <span className="text-primary">Live</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border px-3 py-1 font-medium text-foreground/80 text-xs uppercase tracking-wide"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-foreground/80 text-sm">
                    Performance chart
                  </p>
                  <div className="h-28 w-full rounded-2xl bg-gradient-to-r from-primary/30 to-transparent" />
                </div>
                <div className="rounded-2xl border border-border bg-muted p-4 text-foreground text-sm shadow-sm">
                  <p className="font-semibold text-foreground">
                    Next article recommended
                  </p>
                  <p className="text-muted-foreground">
                    Topic: Data-personified blogs
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-muted/50 p-4 text-sm">
                <p className="font-semibold text-foreground">Chat</p>
                <p className="text-muted-foreground">
                  “We noticed rising intent around {titles[titleIndex]} — want
                  to approve a draft?”
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
      <Suspense fallback={null}>
        <CrowdCanvas
          className="absolute inset-0 -z-10 opacity-60"
          cols={7}
          rows={15}
          src="/peeps.png"
        />
      </Suspense>
    </div>
  );
};
