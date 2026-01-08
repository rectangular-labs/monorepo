import { useState } from "react";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import {
  Shield,
  Search,
  Zap,
  RotateCcw,
  TrendingUp,
  ChevronRight,
  Check,
  FileText,
  BarChart3,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@rectangular-labs/ui/components/ui/button";

export function FounderTransparency() {
  const [expandedThesis, setExpandedThesis] = useState(false);
  const [expandedAudit, setExpandedAudit] = useState(false);

  const thesisValues = [
    { icon: Search, label: "Forms a clear thesis for organic growth" },
    { icon: Zap, label: "Executes it end-to-end" },
  ];

  const auditValues = [
    { icon: Shield, label: "Self-audits what worked, what didn't, and why" },
    { icon: RotateCcw, label: "Revises direction when assumptions break" },
    { icon: TrendingUp, label: "Shows the logic, not just the outcome" },
  ];

  return (
    <Section className="border-border border-t bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-primary text-xs uppercase tracking-[0.4em]">
            Radical Transparency
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Tells it{" "}
            <span className="font-semibold text-primary">like it is</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl leading-relaxed">
            Tools dump numbers and leave you to make sense of it. SEO services
            polish narratives and stop working after KPIs are met. Your
            co-founder wouldn't do that, so Fluid Posts doesn't.
          </p>
        </div>

        <div className="mx-auto max-w-5xl space-y-12">
          {/* Phase 1: Thesis */}
          <div className="grid gap-12 md:grid-cols-[1.2fr,1fr] md:items-start">
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Week 1: Strategy Formulation
                </div>
                <h3 className="mb-2 font-bold text-foreground text-xl">
                  Growth Thesis: &quot;Utility-First SEO&quot;
                </h3>
                <p className="text-muted-foreground text-sm">
                  FluidPosts.com will win by building 12 &quot;SEO ROI
                  Calculators&quot; targeting founders directly. Thesis:
                  Value-exchange beats passive reading for lead conversion.
                </p>
              </div>

              <ChatMockup className="border-emerald-500/10 bg-emerald-500/[0.01]">
                <ChatMockupMessage from="assistant">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="font-bold text-sm">
                        Thesis: Topical Authority Leadership
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        We'll win by owning the topic:{" "}
                        <strong>
                          AI-assisted custom software for small service
                          businesses.
                        </strong>{" "}
                        We build one parent hub and supporting child pages that
                        answer the exact questions people search before they
                        buy.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <div className="rounded-lg bg-emerald-500/5 p-3 text-[11px]">
                        <p className="mb-2 font-bold text-emerald-700 uppercase tracking-tight">
                          Suggested Clusters:
                        </p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>
                            •{" "}
                            <span className="text-foreground">
                              Educational:
                            </span>{" "}
                            ai-app-development
                          </li>
                          <li>
                            •{" "}
                            <span className="text-foreground">Solutions:</span>{" "}
                            custom ai app solutions for small businesses
                          </li>
                          <li>
                            •{" "}
                            <span className="text-foreground">Templates:</span>{" "}
                            custom app templates for service ops
                          </li>
                        </ul>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        Why: Interlinked entity coverage (portals, internal
                        tools, workflow automation) makes Google trust you on
                        the category.
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-emerald-500/10 border-t pt-4">
                      <p className="text-[10px] text-muted-foreground">
                        Generating outlines pending approval...
                      </p>
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 px-3 text-[11px] hover:bg-emerald-700"
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                        Strategy
                      </Button>
                    </div>
                  </div>
                </ChatMockupMessage>
              </ChatMockup>
            </div>

            <div className="pt-4 md:pt-12">
              <ul className="grid gap-5">
                {thesisValues.map((v) => (
                  <li key={v.label} className="group flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-all group-hover:scale-110">
                      <v.icon className="h-5 w-5" />
                    </div>
                    <span className="pt-1.5 font-medium text-lg leading-tight">
                      {v.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Time Divider */}
          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-border border-t border-dashed" />
            </div>
            <div className="relative flex justify-center">
              <span className="rounded-full border border-border bg-background px-6 py-1.5 font-bold text-[10px] text-muted-foreground uppercase tracking-widest shadow-sm">
                2 Weeks of Data Collection
              </span>
            </div>
          </div>

          {/* Phase 2: Audit */}
          <div className="grid gap-12 md:grid-cols-[1.2fr,1fr] md:items-start">
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 font-bold text-[10px] text-amber-600 uppercase tracking-widest">
                  <FileText className="h-3.5 w-3.5" />
                  Week 3: The Self-Audit
                </div>
                <h3 className="mb-2 font-bold text-foreground text-xl">
                  Cluster Performance Audit
                </h3>
                <p className="text-muted-foreground text-sm">
                  Winner: &quot;Examples&quot; content vs low CTR on
                  &quot;Comparison&quot; pages.
                </p>
              </div>

              <ChatMockup className="border-amber-500/10 bg-amber-500/[0.01]">
                <ChatMockupMessage from="assistant">
                  <div className="space-y-4">
                    <p className="font-bold text-sm">
                      Audit: First 8 Articles (Last 14 Days)
                    </p>

                    <div className="overflow-x-auto rounded-lg border border-amber-500/10 bg-background/50">
                      <table className="w-full text-left text-[10px]">
                        <thead>
                          <tr className="border-amber-500/10 border-b bg-amber-500/5 text-amber-800">
                            <th className="px-3 py-2 font-bold uppercase tracking-tighter">
                              Slug
                            </th>
                            <th className="px-3 py-2 text-right font-bold">
                              Impr
                            </th>
                            <th className="px-3 py-2 text-right font-bold">
                              CTR
                            </th>
                            <th className="px-3 py-2 font-bold">Insight</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-500/5">
                          <tr>
                            <td className="px-3 py-2 font-medium">
                              /internal-tools-examples
                            </td>
                            <td className="px-3 py-2 text-right">18.4k</td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-600">
                              2.7%
                            </td>
                            <td className="px-3 py-2 text-muted-foreground italic">
                              Winner
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium">
                              /ai-vs-no-code
                            </td>
                            <td className="px-3 py-2 text-right">9.7k</td>
                            <td className="px-3 py-2 text-right font-bold text-amber-600">
                              0.8%
                            </td>
                            <td className="px-3 py-2 text-muted-foreground italic">
                              Low Intent
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium">
                              /hvac-portal-builder
                            </td>
                            <td className="px-3 py-2 text-right">4.6k</td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-600">
                              4.6%
                            </td>
                            <td className="px-3 py-2 text-muted-foreground italic">
                              High Conversion
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border-amber-500/20 border-l-2 bg-amber-500/5 p-3 text-[11px]">
                        <p className="mb-1 font-bold text-amber-800">
                          The Pivot:
                        </p>
                        <p className="text-muted-foreground">
                          &quot;Comparison&quot; pages underperformed (0.8%
                          CTR). <strong>Audit says:</strong> Templates
                          won&apos;t lift until they&apos;re positioned as
                          assets linked from &quot;Example&quot; winners.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700">
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="font-bold">Updating Thesis:</span>{" "}
                        Prioritizing &quot;Examples&quot; funnel over
                        &quot;Definitions&quot;.
                      </div>
                    </div>
                  </div>
                </ChatMockupMessage>
              </ChatMockup>
            </div>

            <div className="pt-4 md:pt-12">
              <ul className="grid gap-5">
                {auditValues.map((v) => (
                  <li key={v.label} className="group flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-all group-hover:scale-110">
                      <v.icon className="h-5 w-5" />
                    </div>
                    <span className="pt-1.5 font-medium text-lg leading-tight">
                      {v.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl border-border/50 border-t pt-12 text-center">
          <p className="font-medium text-foreground text-xl italic">
            Fluid Posts works like a co-founder:{" "}
            <span className="font-bold text-primary not-italic">
              no spinning, no hiding. Just clear objective diagnosis.
            </span>
          </p>
        </div>
      </div>
    </Section>
  );
}
