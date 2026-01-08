import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Target,
  Zap,
  ArrowRight,
  TrendingUp,
  BarChart3,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";
import { useState } from "react";
import { cn } from "@rectangular-labs/ui/utils/cn";

export function Strategy() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const actions = [
    {
      id: "win",
      icon: Sparkles,
      color: "emerald",
      title: "Winner: 'SEO Automation'",
      summary: "Top 3 page trending up (+15% visibility).",
      details: [
        "Internal Links: Add 3 links from DA 40+ internal pages.",
        "SERP DA Compare: Our Site (DA 32) vs Top 10 Avg (DA 35). Win probability High.",
        "Reasoning: Searchers now prefer tool-based solutions over tips.",
      ],
    },
    {
      id: "gap",
      icon: Target,
      color: "blue",
      title: "Gap: 'GEO Strategy'",
      summary: "8 low-competition keywords in GEO space.",
      details: [
        "Gap Analysis: Competitors negelcting LLM-intent tokens.",
        "Difficulty Score: 12/100 (Very Easy).",
        "Reasoning: Overtake within 14 days by pivoting compliance guide.",
      ],
    },
    {
      id: "fix",
      icon: Zap,
      color: "rose",
      title: "Fix: 'Content Audits'",
      summary: "4 pages lost position due to intent drift.",
      details: [
        "Issue: Competitors updated with AI-first answers.",
        "Action: Rewrite Section 1 to prioritize direct utility.",
        "Reasoning: Re-align with brand voice to salvage traffic.",
      ],
    },
  ];

  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Continuous Momentum
          </p>
          <h2 className="font-regular text-3xl text-foreground leading-[1.1] tracking-tight sm:text-4xl lg:text-6xl">
            Always Ready with the <br />
            <span className="font-semibold text-primary">Next Win</span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Fluid Posts is always working ahead of you — surfacing gaps to fill,
            winners to double down on, and underperformers to fix.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <ChatMockup className="min-h-[500px] shadow-2xl">
              <ChatMockupMessage from="assistant" delay={0.5}>
                <div className="space-y-6">
                  <p className="text-sm">
                    I've surfaced 3 high-priority actions for{" "}
                    <strong>Fluid Posts</strong>:
                  </p>
                  <div className="grid gap-3">
                    {actions.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() =>
                          setExpandedId(expandedId === act.id ? null : act.id)
                        }
                        className={cn(
                          "w-full rounded-xl border p-3.5 text-left transition-all duration-300",
                          expandedId === act.id
                            ? `border-${act.color}-500 bg-${act.color}-500/[0.03] ring-1 ring-${act.color}-500/20`
                            : "border-border bg-background/50 hover:border-primary/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                act.color === "emerald"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : act.color === "blue"
                                    ? "bg-blue-500/10 text-blue-600"
                                    : "bg-rose-500/10 text-rose-600",
                              )}
                            >
                              <act.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-[11px]">
                                {act.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {act.summary}
                              </p>
                            </div>
                          </div>
                          <ArrowRight
                            className={cn(
                              "h-3 w-3 transition-transform",
                              expandedId === act.id && "rotate-90",
                            )}
                          />
                        </div>

                        <AnimatePresence>
                          {expandedId === act.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 space-y-2 border-border/50 border-t pt-4">
                                {act.details.map((detail) => (
                                  <div
                                    key={detail}
                                    className="flex items-start gap-2 text-[10px]"
                                  >
                                    <div
                                      className={cn(
                                        "mt-1.5 h-1 w-1 shrink-0 rounded-full",
                                        `bg-${act.color}-500`,
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
                      </button>
                    ))}
                  </div>
                  <p className="border-primary/20 border-l pl-2 text-[10px] text-muted-foreground italic">
                    Click a win to see the detailed stats and reasoning.
                  </p>
                </div>
              </ChatMockupMessage>
            </ChatMockup>
            <motion.div
              className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-muted/30 p-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Detailed Reasoning</h3>
                  <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                    Fluid Posts doesn't just give suggestions; it provides the
                    logic, stats, and competitor comparisons behind every move.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-muted/30 p-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Statistical Confidence</h3>
                  <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                    Every win, gap, and fix comes with a probability score based
                    on live SERP data and your site's current authority.
                  </p>
                </div>
              </div>
            </div>
            <p className="border-primary/20 border-l-4 pl-6 text-lg text-muted-foreground italic leading-relaxed">
              "So when you step in, the priorities are already clear, and the
              next win is already in motion."
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
