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
          <div className="grid gap-12 lg:grid-cols-[1fr,450px] lg:items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setExpandedThesis(!expandedThesis)}
                className="group w-full text-left"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-6 transition-all duration-300",
                    expandedThesis
                      ? "border-emerald-500/30 bg-emerald-500/[0.06] shadow-emerald-500/5 shadow-lg"
                      : "border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] hover:shadow-md",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                        <BarChart3 className="h-3 w-3" /> Week 1: Strategy
                      </div>
                      <h3 className="font-bold text-foreground text-lg">
                        Growth Thesis: &quot;Topical Authority&quot;
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Own the niche: AI-assisted custom software for service
                        businesses.
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-emerald-500 transition-transform duration-300",
                        expandedThesis
                          ? "rotate-90"
                          : "opacity-30 group-hover:opacity-100",
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {expandedThesis && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 space-y-4 border-emerald-500/10 border-t pt-6">
                          <ChatMockup className="border-emerald-500/10 bg-background/50 shadow-sm">
                            <ChatMockupMessage from="assistant">
                              <div className="space-y-4">
                                <p className="font-bold text-sm">
                                  Thesis: Establish Topical Authority
                                </p>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                  We&apos;ll win by owning the topic:{" "}
                                  <strong>
                                    AI-assisted custom software for small
                                    service businesses.
                                  </strong>{" "}
                                  Building one parent hub + supporting child
                                  pages to answer pre-purchase questions.
                                </p>
                                <div className="rounded-lg bg-emerald-500/5 p-3 text-[11px]">
                                  <p className="mb-2 font-bold text-emerald-700 uppercase tracking-tight">
                                    Suggested Clusters:
                                  </p>
                                  <ul className="space-y-1 text-muted-foreground">
                                    <li>
                                      • <strong>Edu:</strong> ai-app-development
                                    </li>
                                    <li>
                                      • <strong>Solutions:</strong> custom ai
                                      apps for SMBs
                                    </li>
                                    <li>
                                      • <strong>Templates:</strong> service ops
                                      templates
                                    </li>
                                  </ul>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                  Logic: Consistent entity coverage makes Google
                                  trust you on the category.
                                </p>
                                <div className="flex items-center justify-between border-emerald-500/10 border-t pt-3">
                                  <span className="text-[10px] text-muted-foreground">
                                    Awaiting approval...
                                  </span>
                                  <Button
                                    size="sm"
                                    className="h-8 bg-emerald-600 px-3 text-[11px] hover:bg-emerald-700"
                                  >
                                    <Check className="mr-1.5 h-3 w-3" /> Approve
                                    Strategy
                                  </Button>
                                </div>
                              </div>
                            </ChatMockupMessage>
                          </ChatMockup>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </div>

            <div className="space-y-6">
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
          <div className="grid gap-12 lg:grid-cols-[1fr,450px] lg:items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setExpandedAudit(!expandedAudit)}
                className="group w-full text-left"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-6 transition-all duration-300",
                    expandedAudit
                      ? "border-amber-500/30 bg-amber-500/[0.06] shadow-amber-500/5 shadow-lg"
                      : "border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] hover:shadow-md",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-[10px] text-amber-600 uppercase tracking-widest">
                        <FileText className="h-3 w-3" /> Week 3: Self-Audit
                      </div>
                      <h3 className="font-bold text-foreground text-lg">
                        Cluster Performance Audit
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Winner: &quot;Examples&quot; vs underperforming
                        &quot;Templates&quot;. Pivot detected.
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-amber-500 transition-transform duration-300",
                        expandedAudit
                          ? "rotate-90"
                          : "opacity-30 group-hover:opacity-100",
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {expandedAudit && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 space-y-4 border-amber-500/10 border-t pt-6">
                          <ChatMockup className="border-amber-500/10 bg-background/50 shadow-sm">
                            <ChatMockupMessage from="assistant">
                              <div className="space-y-4">
                                <p className="font-bold text-sm">
                                  Self-Audit: First 8 Articles
                                </p>
                                <div className="overflow-hidden rounded-lg border border-amber-500/10 bg-background/50">
                                  <table className="w-full text-left text-[9px]">
                                    <thead className="bg-amber-500/5 text-amber-800">
                                      <tr>
                                        <th className="px-2 py-1.5 font-bold uppercase">
                                          Slug
                                        </th>
                                        <th className="px-2 py-1.5 text-right font-bold">
                                          Impr
                                        </th>
                                        <th className="px-2 py-1.5 text-right font-bold">
                                          CTR
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-500/5">
                                      <tr>
                                        <td className="px-2 py-1.5 font-medium">
                                          /internal-tools-examples
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                          18.4k
                                        </td>
                                        <td className="px-2 py-1.5 text-right font-bold text-emerald-600">
                                          2.7%
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-2 py-1.5 font-medium">
                                          /hvac-portal-builder
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                          4.6k
                                        </td>
                                        <td className="px-2 py-1.5 text-right font-bold text-emerald-600">
                                          4.6%
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-2 py-1.5 font-medium opacity-50">
                                          /templates-starter
                                        </td>
                                        <td className="px-2 py-1.5 text-right opacity-50">
                                          2.1k
                                        </td>
                                        <td className="px-2 py-1.5 text-right font-bold text-amber-600">
                                          0.9%
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <div className="space-y-2">
                                  <div className="rounded-lg border-amber-500/20 border-l-2 bg-amber-500/5 p-3 text-[11px]">
                                    <p className="mb-1 font-bold text-amber-800">
                                      What didn&apos;t work:
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                      Templates underperformed because they
                                      weren&apos;t presented as assets. They
                                      won&apos;t lift until linked from the
                                      &quot;Example&quot; winners.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 rounded bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700">
                                    <RotateCcw className="h-3 w-3" />
                                    <span className="font-bold">
                                      The Pivot:
                                    </span>{" "}
                                    Funneling winners into asset pages.
                                  </div>
                                </div>
                              </div>
                            </ChatMockupMessage>
                          </ChatMockup>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </div>

            <div className="space-y-6">
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
