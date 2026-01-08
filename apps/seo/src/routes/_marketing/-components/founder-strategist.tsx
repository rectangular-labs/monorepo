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
      id: "fix",
      icon: Sparkles,
      color: "emerald",
      title: "Strategy A: Fix Low CTR Winners",
      summary:
        "3 pages are ranking on Page 1 but losing clicks. Immediate win via title & snippet alignment.",
      details: [
        "Priority: '/ai-vs-no-code' (9.7k impressions, 0.8% CTR).",
        "Action: Rewrite title to 'AI vs No-Code vs Developers: The Fastest Path to a Real Client Portal (2026)'.",
        "Enhancement: Add FAQ schema + 'What you'll build' sections to expand SERP real estate.",
        "Internal Links: Funnel authority from winners into '/client-portal-starter' template.",
      ],
    },
    {
      id: "gap",
      icon: Target,
      color: "blue",
      title: "Strategy B: Competitor Gap (GEO + Long-tail)",
      summary:
        "Target service-niche + workflow queries that major competitors like 'AgencyPro' ignore.",
      details: [
        "Theme: 'client portal app for HVAC company' + 'job scheduling app for cleaning business'.",
        "Gap: Big competitors target generic head terms; we win on specific 'build X for Y' long-tail.",
        "Publication: New industry BOFU pages like '/solutions/industries/hvac/client-portal-app/'.",
        "GEO: (Optional) Add 'AI app builder for [City]' modifiers where you have support coverage.",
      ],
    },
  ];

  return (
    <Section className="border-border border-t">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8 text-left">
          <div className="space-y-4">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
              The 24/7 Strategist
            </p>
            <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-6xl">
              Never guess <br />
              <span className="font-semibold text-primary">
                what to do next
              </span>
            </h2>
            <p className="text-muted-foreground text-xl leading-relaxed">
              Fluid Posts analyzes live keyword data, GEO signals, and search
              behavior to decide what matters next — so strategy arrives
              justified and ready for approval.
            </p>
          </div>
          <div className="space-y-4">
            <p className="font-bold text-primary text-sm italic">
              "Strategy won’t pause, and neither will momentum."
            </p>
          </div>
        </div>

        <div className="relative">
          <ChatMockup className="min-h-[500px] shadow-2xl">
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
                          ? `border-${s.color}-500 bg-${s.color}-500/[0.03] ring-1 ring-${s.color}-500/20 shadow-md`
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
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-bold text-[11px]">
                            {s.title}
                          </p>
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
