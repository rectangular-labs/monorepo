import {
  Grid,
  MousePointer2,
  Target,
} from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function FounderStrategist() {
  const [selectedId, setSelectedId] = useState<string>("cta");

  type ActionColor = "emerald" | "blue" | "rose";

  const actionColorStyles: Record<
    ActionColor,
    { expanded: string; icon: string; approveButton: string }
  > = {
    emerald: {
      expanded:
        "border-emerald-500 bg-emerald-500/[0.03] ring-1 ring-inset ring-emerald-500/20",
      icon: "bg-emerald-500/10 text-emerald-600",
      approveButton: "bg-emerald-600 hover:bg-emerald-700",
    },
    blue: {
      expanded:
        "border-blue-500 bg-blue-500/[0.03] ring-1 ring-inset ring-blue-500/20",
      icon: "bg-blue-500/10 text-blue-600",
      approveButton: "bg-blue-600 hover:bg-blue-700",
    },
    rose: {
      expanded:
        "border-rose-500 bg-rose-500/[0.03] ring-1 ring-inset ring-rose-500/20",
      icon: "bg-rose-500/10 text-rose-600",
      approveButton: "bg-rose-600 hover:bg-rose-700",
    },
  };

  const actions = [
    {
      id: "cta",
      icon: MousePointer2,
      color: "emerald" satisfies ActionColor,
      title: "Fixing CTAs in published articles",
      shortTitle: "Fixing CTAs in Published Articles",
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
      color: "blue" satisfies ActionColor,
      title: "Double down on MVP building cluster",
      shortTitle: "Double Down on MVP Cluster",
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
      icon: Grid,
      color: "rose" satisfies ActionColor,
      title: "New Cluster: internal tools for SMBs",
      shortTitle: "New Cluster",
      summary: "Identified gap in low-competition, high-ACV keywords.",
      issue:
        "Competitors are ignoring small business internal automation queries like 'custom inventory tracker for SMB'.",
      actionable:
        "Create a new cluster targeting 'Workflow Automation' and 'Internal Dashboards' for service businesses.",
      impact:
        "Capture high-intent leads who are specifically looking for build partners, leading to higher quality sales calls.",
    },
  ] satisfies [
    {
      id: string;
      icon: typeof Target;
      color: ActionColor;
      title: string;
      shortTitle: string;
      summary: string;
      issue: string;
      actionable: string;
      impact: string;
    },
    ...Array<{
      id: string;
      icon: typeof Target;
      color: ActionColor;
      title: string;
      shortTitle: string;
      summary: string;
      issue: string;
      actionable: string;
      impact: string;
    }>,
  ];

  const selected = useMemo(
    () => actions.find((a) => a.id === selectedId) ?? actions[0],
    [actions, selectedId],
  );

  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
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
        </div>

        <div className="relative">
          <ChatMockup className="min-h-[440px] w-full shadow-2xl">
            <ChatMockupMessage from="assistant">
              <div className="space-y-6">
                <p className="text-base">
                  <strong>
                    Ready with 3 actionables for aiappbuilder.example
                  </strong>
                </p>

                <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  {/* Left list */}
                  <div className="grid min-w-0 gap-2">
                    {actions.map((act) => {
                      const isSelected = selectedId === act.id;
                      const selectionRing =
                        act.color === "emerald"
                          ? "ring-emerald-500/25 border-emerald-500/25 bg-emerald-500/[0.03]"
                          : act.color === "blue"
                            ? "ring-blue-500/25 border-blue-500/25 bg-blue-500/[0.03]"
                            : "ring-rose-500/25 border-rose-500/25 bg-rose-500/[0.03]";
                      return (
                        <button
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-background/30 px-3 py-2 text-left transition-all",
                            "hover:border-primary/30 hover:bg-background",
                            isSelected && `ring-1 ${selectionRing}`,
                          )}
                          key={act.id}
                          onClick={() => setSelectedId(act.id)}
                          type="button"
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              actionColorStyles[act.color].icon,
                            )}
                          >
                            <act.icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground leading-[1.15]">
                              {act.title}
                            </p>
                            <p className="-mt-0.5 text-muted-foreground text-sm leading-[1.15]">
                              {act.summary}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right detail panel */}
                  <div
                    className={cn(
                      "relative h-fit min-w-0 self-start overflow-hidden rounded-2xl border border-border bg-background p-4",
                      selected.color === "emerald"
                        ? "border-emerald-500/25 bg-emerald-500/[0.03] ring-1 ring-emerald-500/25"
                        : selected.color === "blue"
                          ? "border-blue-500/25 bg-blue-500/[0.03] ring-1 ring-blue-500/25"
                          : "border-rose-500/25 bg-rose-500/[0.03] ring-1 ring-rose-500/25",
                    )}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/70" />

                    <AnimatePresence mode="wait">
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="relative space-y-3 text-sm"
                        exit={{ opacity: 0, y: 8 }}
                        initial={{ opacity: 0, y: 8 }}
                        key={selected.id}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest",
                            selected.color === "emerald"
                              ? "text-emerald-600"
                              : selected.color === "blue"
                                ? "text-blue-600"
                                : "text-rose-600",
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              selected.color === "emerald"
                                ? "bg-emerald-500"
                                : selected.color === "blue"
                                  ? "bg-blue-500"
                                  : "bg-rose-500",
                            )}
                          />
                          {selected.shortTitle}
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-primary text-xs uppercase tracking-widest">
                            i) Issue / Opportunity
                          </p>
                          <p className="text-muted-foreground leading-relaxed">
                            {selected.issue}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-primary text-xs uppercase tracking-widest">
                            ii) Suggested Actionable
                          </p>
                          <p className="text-muted-foreground leading-relaxed">
                            {selected.actionable}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-primary text-xs uppercase tracking-widest">
                            iii) Impact
                          </p>
                          <p className="font-medium text-muted-foreground leading-relaxed">
                            {selected.impact}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            className={cn(
                              "h-9 flex-1 rounded font-bold text-sm text-white transition-colors",
                              actionColorStyles[selected.color].approveButton,
                            )}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="h-9 flex-1 rounded border border-border bg-background font-bold text-sm transition-colors hover:bg-muted"
                            type="button"
                          >
                            Alter
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            className="absolute -right-10 -bottom-10 -z-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
