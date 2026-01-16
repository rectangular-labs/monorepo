import {
  BarChart3,
  Check,
  ChevronRight,
  FileText,
  RotateCcw,
  Search,
  Shield,
  TrendingUp,
  Zap,
} from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function FounderTransparency() {
  const [expanded, setExpanded] = useState(false);

  const thesisValues = [
    { icon: Search, label: "Forms a clear thesis for organic growth" },
    {
      icon: BarChart3,
      label: "Explains what data informs its thesis and why",
    },
    { icon: Zap, label: "Executes it End-to-End" },
  ];

  const auditValues = [
    { icon: Shield, label: "Self-audits what worked, what didn't, and why" },
    { icon: RotateCcw, label: "Revises direction when assumptions break" },
    { icon: TrendingUp, label: "Shows the logic, not just the outcome" },
  ];

  return (
    <Section className="border-border border-t bg-background">
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

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)]">
            {/* Left: Week 1 */}
            <div className="min-w-0 space-y-6">
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-center">
                <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.4em]">
                  Strategy Formation
                </p>
              </div>
              <ul className="grid gap-5">
                {thesisValues.map((v) => (
                  <li className="group flex items-start gap-4" key={v.label}>
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-all group-hover:scale-110">
                      <v.icon className="h-5 w-5" />
                    </div>
                    <span className="pt-1.5 font-medium text-lg leading-tight">
                      {v.label}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className="group w-full text-left"
                onClick={() => setExpanded(!expanded)}
                type="button"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                    expanded
                      ? "border-emerald-500/45 bg-emerald-500/6 shadow-emerald-500/5 shadow-lg"
                      : "border-emerald-500/35 bg-emerald-500/2 hover:bg-emerald-500/4 hover:shadow-md",
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
                        expanded
                          ? "rotate-90"
                          : "opacity-30 group-hover:opacity-100",
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        animate={{ height: "auto", opacity: 1 }}
                        className="overflow-hidden"
                        exit={{ height: 0, opacity: 0 }}
                        initial={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="mt-2 space-y-2 border-emerald-500/20 border-t pt-2">
                          <ChatMockup
                            className="border-emerald-500/20 bg-background/50 p-2 shadow-sm"
                            contentClassName="space-y-0"
                          >
                            <ChatMockupMessage
                              density="compact"
                              from="assistant"
                              size="sm"
                            >
                              <div className="space-y-3">
                                <p className="font-bold">
                                  Thesis: Establish Topical Authority
                                </p>
                                <p className="text-muted-foreground leading-relaxed">
                                  We&apos;ll win by owning the topic:{" "}
                                  <strong>
                                    AI-assisted custom software for small
                                    service businesses.
                                  </strong>{" "}
                                  Building one parent hub + supporting child
                                  pages to answer pre-purchase questions.
                                </p>
                                <div className="rounded-lg bg-emerald-500/5 p-3">
                                  <p className="mb-2 font-bold text-emerald-700 text-xs uppercase tracking-tight">
                                    Suggested Clusters:
                                  </p>
                                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                                    <li>
                                      <strong>Education:</strong>{" "}
                                      ai-app-development
                                    </li>
                                    <li>
                                      <strong>Solution:</strong> custom ai apps
                                      for SMBs
                                    </li>
                                    <li>
                                      <strong>Templates:</strong> service ops
                                      templates
                                    </li>
                                  </ul>
                                </div>
                                <p className="text-muted-foreground italic">
                                  Logic: Consistent entity coverage makes Google
                                  trust you on the category.
                                </p>
                                <div className="flex items-center justify-between border-emerald-500/10 border-t pt-3">
                                  <span className="text-muted-foreground text-sm">
                                    Awaiting approval...
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      className="h-9 bg-emerald-600 px-4 text-sm hover:bg-emerald-700"
                                      size="sm"
                                    >
                                      <Check className="mr-1.5 h-3 w-3" />{" "}
                                      Approve Strategy
                                    </Button>
                                    <Button
                                      className="h-9"
                                      size="sm"
                                      variant="outline"
                                    >
                                      Suggest changes
                                    </Button>
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

            {/* Center: 2 weeks */}
            <div className="hidden h-full flex-col items-center lg:flex">
              <div className="h-10 w-px border-border border-l border-dashed" />
              <div className="my-3 flex flex-col items-center gap-1 rounded-2xl border border-border bg-background px-3 py-2 text-center shadow-sm">
                <span className="font-bold text-[10px] text-foreground uppercase tracking-widest">
                  2 Weeks
                </span>
                <span className="font-bold text-[10px] text-foreground uppercase tracking-widest">
                  of Data
                </span>
                <span className="font-bold text-[10px] text-foreground uppercase tracking-widest">
                  Collection
                </span>
              </div>
              <div className="h-full w-px border-border border-l border-dashed" />
            </div>

            {/* Right: Week 3 */}
            <div className="min-w-0 space-y-6">
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-center">
                <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.4em]">
                  Self Auditing
                </p>
              </div>
              <ul className="grid gap-5">
                {auditValues.map((v) => (
                  <li className="group flex items-start gap-4" key={v.label}>
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-all group-hover:scale-110">
                      <v.icon className="h-5 w-5" />
                    </div>
                    <span className="pt-1.5 font-medium text-lg leading-tight">
                      {v.label}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className="group w-full text-left"
                onClick={() => setExpanded(!expanded)}
                type="button"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                    expanded
                      ? "border-amber-500/45 bg-amber-500/6 shadow-amber-500/5 shadow-lg"
                      : "border-amber-500/35 bg-amber-500/2 hover:bg-amber-500/4 hover:shadow-md",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-[10px] text-amber-600 uppercase tracking-widest">
                        <FileText className="h-3 w-3" /> Week 3: Self-Audit
                      </div>
                      <h3 className="font-bold text-foreground text-lg">
                        Cluster performance audit
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Winner: &quot;Examples&quot; vs underperforming
                        &quot;Templates&quot;. Pivot detected.
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-amber-500 transition-transform duration-300",
                        expanded
                          ? "rotate-90"
                          : "opacity-30 group-hover:opacity-100",
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        animate={{ height: "auto", opacity: 1 }}
                        className="overflow-hidden"
                        exit={{ height: 0, opacity: 0 }}
                        initial={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="mt-2 space-y-2 border-amber-500/20 border-t pt-2">
                          <ChatMockup
                            className="border-amber-500/20 bg-background/50 p-2 shadow-sm"
                            contentClassName="space-y-0"
                          >
                            <ChatMockupMessage
                              density="compact"
                              from="assistant"
                              size="sm"
                            >
                              <div className="space-y-1">
                                <p className="font-bold leading-tight">
                                  Self-Audit: First 8 Articles
                                </p>
                                <div className="overflow-hidden rounded-lg border border-amber-500/20 bg-background/50">
                                  <table className="w-full text-left text-[9px]">
                                    <thead className="bg-amber-500/5 text-amber-800">
                                      <tr>
                                        <th className="px-2 py-1 font-bold uppercase">
                                          Slug
                                        </th>
                                        <th className="px-2 py-1 text-right font-bold">
                                          Impr
                                        </th>
                                        <th className="px-2 py-1 text-right font-bold">
                                          CTR
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-500/10">
                                      <tr>
                                        <td className="px-2 py-1 font-medium">
                                          /internal-tools-examples
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                          18.4k
                                        </td>
                                        <td className="px-2 py-1 text-right font-bold text-emerald-600">
                                          2.7%
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-2 py-1 font-medium">
                                          /hvac-portal-builder
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                          4.6k
                                        </td>
                                        <td className="px-2 py-1 text-right font-bold text-emerald-600">
                                          4.6%
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-2 py-1 font-medium">
                                          /saas-checklist
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                          12.9k
                                        </td>
                                        <td className="px-2 py-1 text-right font-bold text-emerald-600">
                                          2.8%
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-2 py-1 font-medium opacity-50">
                                          /ai-vs-no-code
                                        </td>
                                        <td className="px-2 py-1 text-right opacity-50">
                                          9.7k
                                        </td>
                                        <td className="px-2 py-1 text-right font-bold text-amber-600">
                                          0.8%
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-2 py-1 font-medium opacity-50">
                                          /templates-starter
                                        </td>
                                        <td className="px-2 py-1 text-right opacity-50">
                                          2.1k
                                        </td>
                                        <td className="px-2 py-1 text-right font-bold text-amber-600">
                                          0.9%
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <div className="space-y-3 pt-1">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest">
                                      <TrendingUp className="h-3 w-3" />{" "}
                                      Performance Thesis
                                    </div>
                                    <p className="border-primary/20 border-l-2 pl-3 text-muted-foreground italic leading-relaxed">
                                      Comparison and decision-based content is
                                      ranking faster and converting at 2x the
                                      rate of generic definitions. Google is
                                      rewarding our highly-structured,
                                      actionable frameworks over surface-level
                                      guides.
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest">
                                      <Zap className="h-3 w-3" /> Actionables
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2.5">
                                        <p className="mb-0.5 font-bold text-emerald-700">
                                          Double Down
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                          Expand the &quot;Education&quot;
                                          cluster with 3 new companion articles
                                          targeting follow-up intent.
                                        </p>
                                      </div>
                                      <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-2.5">
                                        <p className="mb-0.5 font-bold text-amber-700">
                                          Quick Fix
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                          Rewrite meta titles for template
                                          articles posts to be outcome-led,
                                          targeting a 5% CTR lift.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </ChatMockupMessage>
                          </ChatMockup>

                          <div className="mt-3 flex gap-2 border-amber-500/10 border-t pt-3">
                            <Button
                              className="h-9 flex-1 bg-amber-600 text-sm hover:bg-amber-700"
                              size="sm"
                            >
                              <Check className="mr-1.5 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              className="h-9 flex-1"
                              size="sm"
                              variant="outline"
                            >
                              Suggest changes
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
