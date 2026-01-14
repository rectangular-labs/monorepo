import {
  ArrowRight,
  BarChart3,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function Strategy() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  type ActionColor = "emerald" | "blue" | "rose";

  const actionColorStyles: Record<
    ActionColor,
    { expanded: string; icon: string; approveButton: string }
  > = {
    emerald: {
      expanded:
        "border-emerald-500 bg-emerald-500/[0.03] ring-1 ring-emerald-500/20",
      icon: "bg-emerald-500/10 text-emerald-600",
      approveButton: "bg-emerald-600 hover:bg-emerald-700",
    },
    blue: {
      expanded: "border-blue-500 bg-blue-500/[0.03] ring-1 ring-blue-500/20",
      icon: "bg-blue-500/10 text-blue-600",
      approveButton: "bg-blue-600 hover:bg-blue-700",
    },
    rose: {
      expanded: "border-rose-500 bg-rose-500/[0.03] ring-1 ring-rose-500/20",
      icon: "bg-rose-500/10 text-rose-600",
      approveButton: "bg-rose-600 hover:bg-rose-700",
    },
  };

  const actions = [
    {
      id: "cta",
      icon: Sparkles,
      color: "emerald",
      title: "Fixing CTAs in published articles",
      summary: "High impressions but low conversion path engagement.",
      issue:
        "Current articles rank well but use generic 'Contact Us' buttons, resulting in a 0.5% lead conversion rate.",
      actionable:
        "Implement context-specific CTAs (e.g., 'Download MVP Checklist') mapped to the reader's decision stage.",
      impact:
        "Projected 3x increase in lead capture without requiring new traffic or higher rankings.",
    },
    {
      id: "mvp",
      icon: Target,
      color: "blue",
      title: "Double down on MVP building cluster",
      summary: "Topical authority established; high CTR on parent pillar.",
      issue:
        "The '/resources/ai-mvp/' pillar is over-performing, but lacks depth in technical child pages to keep users on-site.",
      actionable:
        "Launch 4 new child articles covering 'Cost', 'Tech Stack', and 'Timeline' to own the cluster end-to-end.",
      impact:
        "Establish absolute topical authority, making it harder for competitors to displace our Page 1 positions.",
    },
    {
      id: "internal",
      icon: Zap,
      color: "rose",
      title: "New Cluster: internal tools for SMBs",
      summary: "Identified gap in low-competition, high-ACV keywords.",
      issue:
        "Competitors are ignoring small business internal automation queries like 'custom inventory tracker for SMB'.",
      actionable:
        "Create a new cluster targeting 'Workflow Automation' and 'Internal Dashboards' for service businesses.",
      impact:
        "Capture high-intent leads who are specifically looking for build partners, leading to higher quality sales calls.",
    },
  ] satisfies Array<{
    id: string;
    icon: typeof Sparkles;
    color: ActionColor;
    title: string;
    summary: string;
    issue: string;
    actionable: string;
    impact: string;
  }>;

  return (
    <Section className="max-w-none border-border border-t bg-background">
      <div className="mx-auto w-full space-y-12 px-4 md:px-12">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h2 className="font-regular text-4xl text-foreground leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
            Surfacing 3 high-priority actions for <br />
            <span className="font-semibold text-primary">
              aiappbuilder.example
            </span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Fluid Posts is always working ahead of you — surfacing gaps to fill,
            winners to double down on, and underperformers to fix.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <ChatMockup className="min-h-[500px] shadow-2xl">
              <ChatMockupMessage delay={0.5} from="assistant">
                <div className="space-y-6">
                  <p className="text-sm">
                    Surfacing 3 high-priority actions for{" "}
                    <strong>aiappbuilder.example</strong>:
                  </p>
                  <div className="grid gap-3">
                    {actions.map((act) => (
                      <button
                        className={cn(
                          "w-full rounded-xl border p-3.5 text-left transition-all duration-300",
                          expandedId === act.id
                            ? actionColorStyles[act.color].expanded
                            : "border-border bg-background/50 hover:border-primary/50",
                        )}
                        key={act.id}
                        onClick={() =>
                          setExpandedId(expandedId === act.id ? null : act.id)
                        }
                        type="button"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                actionColorStyles[act.color].icon,
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
                              animate={{ height: "auto", opacity: 1 }}
                              className="overflow-hidden"
                              exit={{ height: 0, opacity: 0 }}
                              initial={{ height: 0, opacity: 0 }}
                            >
                              <div className="mt-4 space-y-4 border-border/50 border-t pt-4 text-[10px]">
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <p className="font-bold text-[8px] text-primary uppercase tracking-widest">
                                      i) Issue / Opportunity
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                      {act.issue}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-bold text-[8px] text-primary uppercase tracking-widest">
                                      ii) Suggested Actionable
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                      {act.actionable}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-bold text-[8px] text-primary uppercase tracking-widest">
                                      iii) Impact
                                    </p>
                                    <p className="font-medium text-muted-foreground leading-relaxed">
                                      {act.impact}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <button
                                    className={cn(
                                      "h-8 flex-1 rounded font-bold text-[10px] text-white transition-colors",
                                      actionColorStyles[act.color]
                                        .approveButton,
                                    )}
                                    type="button"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="h-8 flex-1 rounded border border-border bg-background font-bold text-[10px] transition-colors hover:bg-muted"
                                    type="button"
                                  >
                                    Alter
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    ))}
                  </div>
                  <p className="border-primary/20 border-l pl-2 text-[10px] text-muted-foreground italic">
                    Click a win to see the detailed justifications and take
                    action.
                  </p>
                </div>
              </ChatMockupMessage>
            </ChatMockup>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
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
