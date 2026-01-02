import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { buttonVariants } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense } from "react";
import { ONBOARD_LINK } from "./constants";

const CrowdCanvas = lazy(() =>
  import("@rectangular-labs/ui/components/background/crowd").then((m) => ({
    default: m.CrowdCanvas,
  })),
);

export const Hero = () => {
  return (
    <div className="relative min-h-screen w-full lg:min-h-[calc(100vh-70px)]">
      <Section className="relative z-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[7fr,5fr]">
          <div className="space-y-6 text-left">
            <h1 className="font-regular text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
              You bring the expertise – <br />
              <span className="font-semibold text-primary">
                we remove the ceiling.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Fluid Posts is built around where your value actually lies — your
              expertise and decisions — and removes the execution that limits
              them.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                className={buttonVariants({
                  className: "gap-3",
                  size: "lg",
                })}
                href={ONBOARD_LINK}
                rel="noopener"
                target="_blank"
              >
                Join the waitlist <MoveRight className="h-4 w-4" />
              </a>
              <p className="font-medium text-muted-foreground text-sm">
                Launching in End-Jan 2026
              </p>
            </div>
          </div>
          <div className="relative w-full">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-background/70 p-8 shadow-2xl backdrop-blur-xl">
              <div className="absolute top-0 right-0 p-4">
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-bold text-[10px] text-primary uppercase tracking-widest">
                  Execution Automated
                </div>
              </div>

              <div className="space-y-8">
                {/* Decision Layer */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Expertise & Decisions
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-muted/50 p-3 font-medium text-xs shadow-sm">
                      Set Content Strategy
                    </div>
                    <div className="rounded-xl border border-border bg-muted/50 p-3 font-medium text-xs shadow-sm">
                      Define Brand Voice
                    </div>
                  </div>
                </div>

                {/* The "Ceiling Remover" visual */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent"
                      animate={{
                        scaleX: [0.8, 1.2, 0.8],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                  <div className="relative flex justify-center">
                    <div className="rounded-full border border-border bg-background px-4 py-1 font-bold text-[10px] uppercase tracking-tighter shadow-lg">
                      Removing execution limits
                    </div>
                  </div>
                </div>

                {/* Execution Layer */}
                <div className="space-y-3 opacity-60 grayscale-[0.5]">
                  <div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                    Manual Execution (Ceiling Removed)
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-muted" />
                    <div className="h-2 w-3/4 rounded-full bg-muted" />
                    <div className="h-2 w-1/2 rounded-full bg-muted" />
                  </div>
                </div>
              </div>

              {/* Decorative breakthrough elements */}
              <motion.div
                className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
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
