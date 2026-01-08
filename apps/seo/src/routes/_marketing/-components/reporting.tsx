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
      title: "Enterprise AI Workflows",
      keyword: "AI Execution",
      impressions: "1.2k",
      clicks: 45,
      url: "/blog/enterprise-ai",
      cluster: "Workflows",
    },
    {
      title: "SaaS Content Automation",
      keyword: "SaaS SEO",
      impressions: "850",
      clicks: 32,
      url: "/blog/saas-automation",
      cluster: "Automation",
    },
  ];

  return (
    <Section className="border-border border-t">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8 text-left">
          <div className="space-y-4">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
              Deep Insights
            </p>
            <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-6xl">
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
                <div className="space-y-2">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Overall Strategy:
                  </p>
                  <p className="font-medium text-xs">
                    Aggressive acquisition of 'Execution-Intent' keywords to
                    bypass generic competition.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Articles Written This Month:
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
                              Key: {art.keyword}
                            </span>
                            <span className="font-medium text-[8px] text-primary">
                              {art.cluster}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-[9px]">
                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {art.impressions}
                            </p>
                            <p className="text-muted-foreground">Imps</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">
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

                <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/[0.02] p-3">
                  <div className="flex items-center gap-2 font-bold text-[10px] text-primary">
                    <TrendingUp className="h-3 w-3" /> Thesis on Performance
                  </div>
                  <p className="border-primary/20 border-l-2 pl-3 text-[10px] text-muted-foreground italic leading-relaxed">
                    "The 'Workflows' cluster is over-performing (+24% CTR)
                    because competitors are still chasing word count while we
                    provide direct implementation steps."
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 font-bold text-[10px] text-primary hover:underline"
                  >
                    View Full Client Report <ArrowRight className="h-2 w-2" />
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
