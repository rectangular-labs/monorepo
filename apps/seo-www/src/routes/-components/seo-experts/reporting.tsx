import {
  ArrowRight,
  FileText,
  TrendingUp,
  Zap,
} from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { useState } from "react";
import { ChatMockup } from "./chat-mockup";

export function Reporting() {
  const [isFullReportOpen, setIsFullReportOpen] = useState(false);

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
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        {/* Heading */}
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h2 className="font-regular text-4xl text-foreground leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
            Turn SEO reporting into your <br />
            <span className="font-semibold text-primary">
              unfair advantage.
            </span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Fluid Posts briefs you at a glance — analysing performance with real
            signals and objective diagnosis.
          </p>
        </div>

        {/* Report */}
        <div className="relative">
          <ChatMockup className="border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-border border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
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

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-2">
              <div className="space-y-1 text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                  Clicks
                </p>
                <p className="font-bold text-lg">4,820</p>
                <p className="font-bold text-[10px] text-emerald-500">+41%</p>
              </div>
              <div className="space-y-1 border-border border-x text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                  Impr
                </p>
                <p className="font-bold text-lg">168k</p>
                <p className="font-bold text-[10px] text-emerald-500">+58%</p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                  Avg Pos
                </p>
                <p className="font-bold text-lg">11.6</p>
                <p className="font-bold text-[10px] text-emerald-500">+2.6</p>
              </div>
            </div>

            {isFullReportOpen && (
              <div className="mt-4 space-y-4 border-border border-t pt-4">
                <div className="space-y-2">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Executive Summary
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    This month, we successfully published the articles agreed
                    upon, all within the &quot;AI Execution&quot; cluster. We
                    are seeing strong initial traction on high-intent comparison
                    queries.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                  <div className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
                    <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                      Article Performance
                    </p>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full table-fixed text-left text-[9px]">
                        <thead className="bg-muted/30">
                          <tr className="text-muted-foreground uppercase tracking-widest">
                            <th className="px-2 py-1 font-bold">Article</th>
                            <th className="px-2 py-1 text-right font-bold">
                              Clicks
                            </th>
                            <th className="px-2 py-1 text-right font-bold">
                              CTR
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {recentArticles.map((art) => (
                            <tr key={art.title}>
                              <td className="px-2 py-1">
                                <span className="block truncate font-medium">
                                  {art.title}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-right tabular-nums">
                                {art.clicks}
                              </td>
                              <td className="px-2 py-1 text-right font-bold text-emerald-600 tabular-nums">
                                {art.ctr}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-2 rounded-lg border border-border border-dashed bg-background/40 px-2 py-1">
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded bg-muted/25" />
                        <div className="h-2 w-[92%] rounded bg-muted/20" />
                        <div className="h-2 w-[84%] rounded bg-muted/15" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-border bg-background/50 p-3">
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
                      <div className="grid gap-2 text-[11px] sm:grid-cols-2">
                        <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2">
                          <p className="mb-0.5 font-bold text-emerald-700 underline decoration-emerald-500/30 underline-offset-4">
                            Double Down
                          </p>
                          <p className="text-muted-foreground">
                            Expand the &quot;Education&quot; cluster with 3 new
                            companion articles targeting follow-up intent.
                          </p>
                        </div>
                        <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-2">
                          <p className="mb-0.5 font-bold text-amber-700 underline decoration-amber-500/30 underline-offset-4">
                            Quick Fix
                          </p>
                          <p className="text-muted-foreground">
                            Rewrite meta titles for template articles posts to
                            be outcome-led, targeting a 5% CTR lift.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border border-dashed bg-background/40 p-3">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    More in the report
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="h-2 w-full rounded bg-muted/20" />
                    <div className="h-2 w-[88%] rounded bg-muted/15" />
                    <div className="h-2 w-[76%] rounded bg-muted/10" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-border border-t pt-4">
              <button
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-[11px] text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={() => setIsFullReportOpen(!isFullReportOpen)}
                type="button"
              >
                {isFullReportOpen ? "Hide Full Report" : "View Full Report"}{" "}
                <ArrowRight
                  className={
                    isFullReportOpen ? "h-3 w-3 -rotate-90" : "h-3 w-3"
                  }
                />
              </button>
            </div>
          </ChatMockup>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
