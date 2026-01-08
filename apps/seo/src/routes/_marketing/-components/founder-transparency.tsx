import { Section } from "@rectangular-labs/ui/components/ui/section";
import {
  Shield,
  Search,
  Zap,
  RotateCcw,
  TrendingUp,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function FounderTransparency() {
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
          <div className="grid gap-12 md:grid-cols-[1.2fr,1fr] md:items-center">
            <div className="relative">
              <ChatMockup className="border-emerald-500/20 bg-emerald-500/[0.02] shadow-emerald-500/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-[10px] text-emerald-500 uppercase tracking-widest">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Week 1: Strategy Formulation
                  </div>
                  <ChatMockupMessage from="assistant">
                    <div className="space-y-3">
                      <p className="font-bold text-sm">
                        Growth Thesis: "Utility-First SEO"
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        FluidPosts.com will win by building 12 "SEO ROI
                        Calculators" targeting founders directly. Thesis:
                        Value-exchange beats passive reading for lead
                        conversion.
                      </p>
                    </div>
                  </ChatMockupMessage>
                </div>
              </ChatMockup>
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
          <div className="grid gap-12 md:grid-cols-[1.2fr,1fr] md:items-center">
            <div className="relative">
              <ChatMockup className="border-amber-500/20 bg-amber-500/[0.02] shadow-amber-500/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-[10px] text-amber-500 uppercase tracking-widest">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    Week 3: The Self-Audit
                  </div>
                  <ChatMockupMessage from="assistant">
                    <div className="space-y-3">
                      <p className="font-bold text-amber-600 text-sm">
                        Audit Result: Assumption Broken
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Traffic to ROI Calculators is high, but dwell time is
                        low (avg 14s). Diagnosis: The calculators are too
                        complex for mobile users.
                      </p>
                      <div className="rounded-xl border border-amber-500/20 border-l-4 bg-amber-500/5 p-4 font-medium text-[11px] text-amber-700 italic leading-relaxed">
                        "I am simplifying the inputs and pivoting to a
                        'Quick-Check' format to salvage the cluster."
                      </div>
                    </div>
                  </ChatMockupMessage>
                </div>
              </ChatMockup>
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
