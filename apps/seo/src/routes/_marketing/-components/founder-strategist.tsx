import { Section } from "@rectangular-labs/ui/components/ui/section";
import { useState } from "react";
import {
  Sparkles,
  Target,
  ArrowRight,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { motion, AnimatePresence } from "motion/react";

export function FounderStrategist() {
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);

  const strategies = [
    {
      id: "authority",
      icon: Sparkles,
      color: "emerald",
      title: "Authority Win: 'Founders SEO Framework'",
      summary:
        "Data shows search intent shifting from 'How-to Tips' to 'Actionable Frameworks'.",
      details: [
        "Clustering: Map current 'Tips' content into a cohesive 'Founder Operating System' series.",
        "Link Juice: Redirect authority from high-traffic, low-converting posts into the new framework.",
        "Outcome: Projected 40% increase in lead-intent traffic within 30 days.",
      ],
    },
    {
      id: "gap",
      icon: Target,
      color: "blue",
      title: "Gap: Competitor 'AgencyPro' Content Drift",
      summary:
        "Competitor 'AgencyPro' has stopped updating their 'Automation' cluster.",
      details: [
        "Overtake: Update our 'Workflow Automation' guide with fresh 2026 data and interactive examples.",
        "GEO Hijack: Add specific GEO-intent tokens that Competitor 'AgencyPro' is currently missing.",
        "Outcome: Probability of stealing Position #1 is >85% within 14 days.",
      ],
    },
  ];

  return (
    <Section className="overflow-hidden border-border border-t">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[450px,1fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
              The 24/7 Strategist
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
              Never guess{" "}
              <span className="font-semibold text-primary">
                what to do next
              </span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fluid Posts is the strategist that never clocks out, analyzing live
            keyword data, GEO signals, and search behavior to decide what
            matters next — so strategy arrives justified and ready for approval.
          </p>
          <div className="space-y-4">
            <p className="font-bold text-primary text-sm italic">
              Strategy won’t pause, and neither will momentum.
            </p>
          </div>
        </div>

        <div className="relative">
          <ChatMockup className="min-h-[500px]">
            <ChatMockupMessage from="assistant">
              <div className="space-y-6">
                <p className="font-medium text-sm">
                  I've justified two high-impact strategic shifts for this week:
                </p>
                <div className="grid gap-4">
                  {strategies.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setActiveStrategy(activeStrategy === s.id ? null : s.id)
                      }
                      className={cn(
                        "flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-300",
                        activeStrategy === s.id
                          ? `border-${s.color}-500 bg-${s.color}-500/5 ring-1 ring-${s.color}-500/20`
                          : "border-border bg-background/50 hover:border-primary/50 hover:bg-muted/50",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          s.color === "emerald"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-blue-500/10 text-blue-600",
                        )}
                      >
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs">{s.title}</p>
                          <ArrowRight
                            className={cn(
                              "h-3 w-3 transition-transform duration-300",
                              activeStrategy === s.id
                                ? "rotate-90"
                                : "opacity-30",
                            )}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          {s.summary}
                        </p>

                        <AnimatePresence>
                          {activeStrategy === s.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 space-y-2 border-border/50 border-t pt-4">
                                {s.details.map((detail) => (
                                  <div
                                    key={detail}
                                    className="flex items-start gap-2 text-[10px]"
                                  >
                                    <div
                                      className={cn(
                                        "mt-1.5 h-1 w-1 shrink-0 rounded-full",
                                        s.color === "emerald"
                                          ? "bg-emerald-500"
                                          : "bg-blue-500",
                                      )}
                                    />
                                    <span className="text-muted-foreground leading-relaxed">
                                      {detail}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="border-primary/20 border-l-2 pl-3 text-[10px] text-muted-foreground italic">
                  Click a strategy to see the full reasoning. Ready to execute?
                </p>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
          <motion.div
            className="absolute -right-10 -bottom-10 -z-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
