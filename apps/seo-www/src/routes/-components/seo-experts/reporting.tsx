import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  TrendingUp,
  FileText,
  ExternalLink,
  ArrowRight,
  Zap,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function Reporting() {
  const recentArticles = [
    {
      title: "Build an MVP With AI (Step-by-Step)",
      keyword: "AI MVP",
      clicks: 1420,
      impressions: "34.9k",
      ctr: "4.1%",
    },
    {
      title: "AI App Builder vs hiring a Developer",
      keyword: "Cost vs ROI",
      clicks: 1030,
      impressions: "28.1k",
      ctr: "3.7%",
    },
    {
      title: "SaaS Prototype Checklist",
      keyword: "SaaS Prototype",
      clicks: 760,
      impressions: "19.6k",
      ctr: "3.9%",
    },
    {
      title: "What Is an AI App Builder?",
      keyword: "Definition",
      clicks: 510,
      impressions: "26.7k",
      ctr: "1.9%",
    },
    {
      title: "Custom Software for Small Business",
      keyword: "Guide",
      clicks: 890,
      impressions: "36.4k",
      ctr: "2.4%",
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
          <ChatMockup className="border-border bg-background shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-border border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Monthly Performance Report
                  </p>
                  <p className="font-bold text-sm">aiappbuilder.example</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Period
                </p>
                <p className="font-medium text-xs">Jan 2026</p>
              </div>
            </div>

            <ChatMockupMessage from="assistant">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Executive Summary
                  </p>
                  <p className="text-sm leading-relaxed">
                    This month, we successfully published the **5 articles**
                    agreed upon, all within the "AI Execution" cluster. We are
                    seeing strong initial traction on high-intent comparison
                    queries.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="space-y-1 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                      Clicks
                    </p>
                    <p className="font-bold text-xl">4,820</p>
                    <p className="font-bold text-[10px] text-emerald-500">
                      +41%
                    </p>
                  </div>
                  <div className="space-y-1 border-border border-x text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                      Impr
                    </p>
                    <p className="font-bold text-xl">168k</p>
                    <p className="font-bold text-[10px] text-emerald-500">
                      +58%
                    </p>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                      Avg Pos
                    </p>
                    <p className="font-bold text-xl">11.6</p>
                    <p className="font-bold text-[10px] text-emerald-500">
                      +2.6
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Article Performance
                  </p>
                  <div className="grid gap-2 overflow-hidden rounded-lg border border-border text-[10px]">
                    <div className="grid grid-cols-[1fr,50px,50px] gap-2 border-border border-b bg-muted/50 px-3 py-2 font-bold uppercase tracking-tighter">
                      <span>Article</span>
                      <span className="text-right">Clicks</span>
                      <span className="text-right">CTR</span>
                    </div>
                    {recentArticles.map((art) => (
                      <div
                        key={art.title}
                        className="grid grid-cols-[1fr,50px,50px] gap-2 border-border border-b px-3 py-2 last:border-0"
                      >
                        <span className="truncate font-medium">
                          {art.title}
                        </span>
                        <span className="text-right">{art.clicks}</span>
                        <span className="text-right font-bold text-emerald-600">
                          {art.ctr}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[10px] text-primary uppercase tracking-widest">
                      <TrendingUp className="h-3 w-3" /> Performance Thesis
                    </div>
                    <p className="border-primary/20 border-l-2 pl-3 text-muted-foreground text-xs italic leading-relaxed">
                      Comparison and decision-based content is ranking faster
                      and converting at 2x the rate of generic definitions.
                      Google is rewarding our highly-structured, actionable
                      frameworks over surface-level guides.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[10px] text-primary uppercase tracking-widest">
                      <Zap className="h-3 w-3" /> Actionables
                    </div>
                    <div className="grid gap-2 text-[11px]">
                      <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
                        <p className="mb-1 font-bold text-emerald-700 underline decoration-emerald-500/30 underline-offset-4">
                          Double Down
                        </p>
                        <p className="text-muted-foreground">
                          Expand the "MVP Build" cluster with 3 new companion
                          articles targeting follow-up intent.
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                        <p className="mb-1 font-bold text-amber-700 underline decoration-amber-500/30 underline-offset-4">
                          Quick Fix
                        </p>
                        <p className="text-muted-foreground">
                          Rewrite meta titles for definition-style posts to be
                          outcome-led, targeting a 20% CTR lift.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-border border-t pt-4">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-[11px] text-white transition-colors hover:bg-primary/90"
                  >
                    View Full Insight <ArrowRight className="h-3 w-3" />
                  </button>
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
