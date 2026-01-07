import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  Shield,
  Search,
  Zap,
  RotateCcw,
  TrendingUp,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

const values = [
  { icon: Search, label: "Forms a clear thesis for organic growth" },
  { icon: Zap, label: "Executes against it end-to-end" },
  { icon: Shield, label: "Self-audits what worked, what didn't, and why" },
  { icon: RotateCcw, label: "Revises direction when assumptions break" },
  { icon: TrendingUp, label: "Shows the logic, not just the outcome" },
];

export function FounderTransparency() {
  return (
    <Section className="border-border border-t bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-primary text-xs uppercase tracking-[0.4em]">
            Radical Transparency
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Tells it <span className="font-semibold text-primary">like it is</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Tools dump numbers and leave you to make sense of it. SEO services
            polish narratives and stop working after KPIs are met. Your
            co-founder wouldn't do that, so Fluid Posts doesn't.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[7fr,5fr] lg:items-center">
          <div className="relative">
            <ChatMockup className="max-w-xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="h-1 w-1 rounded-full bg-emerald-500" />
                    Week 1: The Thesis
                  </div>
                  <ChatMockupMessage role="assistant">
                    <div className="space-y-3">
                      <p className="font-bold text-sm">Growth Thesis: "Utility-First SEO"</p>
                      <p className="text-xs text-muted-foreground">
                        FluidPosts.com will win by building 12 "SEO ROI Calculators" 
                        targeting founders directly. Thesis: Value-exchange beats 
                        passive reading for lead conversion.
                      </p>
                    </div>
                  </ChatMockupMessage>
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      2 Weeks Later
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="h-1 w-1 rounded-full bg-rose-500" />
                    Week 3: The Self-Audit
                  </div>
                  <ChatMockupMessage role="assistant">
                    <div className="space-y-3">
                      <p className="font-bold text-sm text-rose-600">Self-Audit: Assumption Broken</p>
                      <p className="text-xs text-muted-foreground">
                        Traffic to ROI Calculators is high, but dwell time is low (avg 14s). 
                        Diagnosis: The calculators are too complex for mobile users.
                      </p>
                      <div className="rounded-lg border border-border bg-background/50 p-2 text-[10px] font-medium italic">
                        "I am simplifying the inputs and pivoting to a 'Quick-Check' 
                        format to salvage the cluster."
                      </div>
                    </div>
                  </ChatMockupMessage>
                </div>
              </div>
            </ChatMockup>
            <motion.div
              className="absolute -top-10 -left-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-8">
            <ul className="grid gap-6">
              {values.map((v) => (
                <li
                  key={v.label}
                  className="flex items-start gap-4 font-medium"
                >
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <v.icon className="h-3 w-3" />
                  </div>
                  <span className="text-lg leading-tight">{v.label}</span>
                </li>
              ))}
            </ul>
            <p className="text-lg font-medium text-primary italic">
              Fluid Posts works like a co-founder: no spinning, no hiding. Just clear objective diagnosis.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
