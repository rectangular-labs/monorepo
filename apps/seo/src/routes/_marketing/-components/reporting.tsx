import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  TrendingUp,
  FileText,
  ExternalLink,
  ArrowRight,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function Reporting() {
  const recentArticles = [
    {
      title: "Build an MVP With AI (Step-by-Step)",
      keyword: "AI MVP",
      impressions: "34.9k",
      clicks: 1420,
      url: "/blog/ai-mvp-guide",
      cluster: "MVP Build",
    },
    {
      title: "AI App Builder vs Hiring a Developer",
      keyword: "Cost vs ROI",
      impressions: "28.1k",
      clicks: 1030,
      url: "/blog/cost-compare",
      cluster: "Comparison",
    },
    {
      title: "SaaS Prototype Checklist",
      keyword: "SaaS Prototype",
      impressions: "19.6k",
      clicks: 760,
      url: "/blog/saas-checklist",
      cluster: "Actionable",
    },
  ];

  return (
    <Section className="max-w-none border-border border-t">
      <div className="mx-auto grid w-full gap-16 px-4 md:px-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8 text-left">
          <div className="space-y-6">
            <h2 className="font-regular text-4xl text-foreground leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
              Turn SEO reporting into your <br />
              <span className="font-semibold text-primary">
                unfair advantage.
              </span>
            </h2>
            <p className="text-muted-foreground text-xl leading-relaxed">
              Fluid Posts briefs you at a glance — analysing performance with
              real signals and objective diagnosis.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "What’s working",
              "What isn’t",
              "Why it matters",
              "Next actions",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 font-medium text-sm"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <ChatMockup className="shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-border border-b pb-3">
              <div className="flex items-center gap-2 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                <FileText className="h-3 w-3 text-primary" /> Client Monthly
                Performance
              </div>
              <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-[9px] text-primary">
                Dec 2025
              </span>
            </div>

            <ChatMockupMessage from="assistant" delay={0.5}>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 border-border border-b pb-4">
                  <div className="space-y-1">
                    <p className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest">
                      Organic Clicks
                    </p>
                    <p className="font-bold text-foreground text-lg">
                      4,820{" "}
                      <span className="text-[10px] text-emerald-500">
                        (+41%)
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest">
                      Avg Position
                    </p>
                    <p className="font-bold text-foreground text-lg">
                      11.6{" "}
                      <span className="text-[10px] text-emerald-500">
                        (+2.6)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Monthly Analysis:
                  </p>
                  <p className="font-medium text-xs leading-relaxed">
                    Winning on{" "}
                    <span className="text-primary">"how-to / comparison"</span>{" "}
                    queries. BOFU content is pulling high-intent traffic, but 2
                    definition-style posts need CTR surgery.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Top Performers (Last 28 Days):
                  </p>
                  <div className="grid gap-2">
                    {recentArticles.map((art) => (
                      <div
                        key={art.title}
                        className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-2.5 transition-colors hover:border-primary/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-[10px]">
                            {art.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[8px] text-muted-foreground">
                              {art.keyword}
                            </span>
                            <span className="font-medium text-[8px] text-primary">
                              {art.cluster}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-[9px]">
                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {art.clicks}
                            </p>
                            <p className="text-muted-foreground">Clicks</p>
                          </div>
                          <ExternalLink className="h-2.5 w-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/[0.02] p-3 text-[10px]">
                  <div className="flex items-center gap-2 font-bold text-primary uppercase tracking-tighter">
                    <TrendingUp className="h-3 w-3" /> Thesis on Performance
                  </div>
                  <p className="border-primary/20 border-l-2 pl-3 text-muted-foreground italic leading-relaxed">
                    Comparison content helps users decide ("X vs Y", "cost").
                    These keywords sit closer to purchase intent—rewarding our
                    "actionable" structure over generic definitions.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 font-bold text-[10px] text-primary hover:underline"
                  >
                    View Full Insight <ArrowRight className="h-2 w-2" />
                  </button>
                  <span className="text-[9px] text-muted-foreground italic">
                    Generated in 1.4s
                  </span>
                </div>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
          <motion.div
            className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
