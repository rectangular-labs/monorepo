import {
  AlertIcon,
  Check,
  EyeOn,
  RotateCcw,
} from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function FounderIntervention() {
  const [activeId, setActiveId] = useState<"approve" | "review" | "correct">(
    "approve",
  );

  const steps = [
    {
      id: "approve",
      icon: Check,
      title: "Approve direction",
      desc: "Greenlight a new cluster or pivot with one click.",
      color: "emerald",
    },
    {
      id: "review",
      icon: EyeOn,
      title: "Review outputs",
      desc: "Quickly scan logic + voice before anything ships.",
      color: "blue",
    },
    {
      id: "correct",
      icon: AlertIcon,
      title: "Correct drift",
      desc: "Fix misunderstandings before they become bad output.",
      color: "rose",
    },
  ] as const;

  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Efficiency
          </p>
          <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Intervene only{" "}
            <span className="font-semibold text-primary">where it counts</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl leading-relaxed">
            Founders shouldn't be micromanaging SEO. Fluid Posts handles
            auditing, planning, writing, and publishing — pulling you in only at
            critical moments.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-background/50 p-6 shadow-sm backdrop-blur">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="grid gap-3">
              {steps.map((s) => {
                const isActive = activeId === s.id;
                const styles =
                  s.color === "emerald"
                    ? {
                        ring: "ring-emerald-500/25 border-emerald-500/25 bg-emerald-500/[0.03]",
                        icon: "bg-emerald-500/10 text-emerald-600",
                        dot: "bg-emerald-500",
                      }
                    : s.color === "blue"
                      ? {
                          ring: "ring-blue-500/25 border-blue-500/25 bg-blue-500/[0.03]",
                          icon: "bg-blue-500/10 text-blue-600",
                          dot: "bg-blue-500",
                        }
                      : {
                          ring: "ring-rose-500/25 border-rose-500/25 bg-rose-500/[0.03]",
                          icon: "bg-rose-500/10 text-rose-600",
                          dot: "bg-rose-500",
                        };

                return (
                  <button
                    className={cn(
                      "flex w-full items-start gap-4 rounded-2xl border border-border/50 bg-background/30 p-4 text-left transition-all",
                      "hover:border-primary/30 hover:bg-background",
                      isActive && `ring-1 ${styles.ring}`,
                    )}
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    type="button"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        styles.icon,
                      )}
                    >
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="font-bold text-foreground">{s.title}</p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic visual */}
            <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-border bg-background p-6">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/70" />

              <AnimatePresence mode="wait">
                {activeId === "approve" && (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    initial={{ opacity: 0, y: 8 }}
                    key="approve"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Approval checkpoint
                      </div>
                      <div className="rounded-xl border border-emerald-500/15 bg-background/60 p-4">
                        <p className="font-bold text-sm">
                          Approve: Topical Authority strategy
                        </p>
                        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                          One parent hub + supporting child pages. Pivot
                          detected: funnel “Examples” into high-intent asset
                          pages.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-emerald-500/70" />
                        Clicking approve starts outlines → publishing.
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeId === "review" && (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    initial={{ opacity: 0, y: 8 }}
                    key="review"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-bold text-[10px] text-blue-600 uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Quality scan
                      </div>
                      <div className="rounded-xl border border-blue-500/15 bg-background/60 p-4">
                        <p className="font-bold text-sm">
                          Draft ready for review
                        </p>
                        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                          Scan tone + reasoning. If anything feels off, tweak it
                          before it ships.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-blue-500/10 bg-background/60 p-3 text-[10px]">
                          Open in editor
                        </div>
                        <div className="rounded-lg border border-blue-500/10 bg-background/60 p-3 text-[10px]">
                          Publish now
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeId === "correct" && (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    initial={{ opacity: 0, y: 8 }}
                    key="correct"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-bold text-[10px] text-rose-600 uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Drift detected
                      </div>
                      <div className="rounded-xl border border-rose-500/15 bg-background/60 p-4">
                        <p className="font-bold text-sm">Recalibrate intent</p>
                        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                          Drafts skewing too technical. Confirm a Founder tone
                          before the next batch.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <RotateCcw className="h-3 w-3 text-rose-600" />
                        Correction prevents compounding wrong output.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
