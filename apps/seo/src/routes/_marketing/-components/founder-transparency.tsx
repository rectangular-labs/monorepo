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
  { icon: Shield, label: "Self-audits what worked and what didn't" },
  { icon: RotateCcw, label: "Revises direction when assumptions break" },
  { icon: TrendingUp, label: "Shows the logic, not just the outcome" },
];

export function FounderTransparency() {
  return (
    <Section className="border-border border-t bg-muted/30">
      <div className="mx-auto max-w-6xl gap-16 lg:grid lg:grid-cols-[1fr,1fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-bold text-primary text-xs uppercase tracking-[0.4em]">
              Radical Transparency
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
              Tells it{" "}
              <span className="font-semibold text-primary">like it is</span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Most tools dump numbers and leave you to make sense of it. Most SEO
            services polish narratives and stop working after KPIs are met.
            Fluid Posts works like a co-founder: no spinning, no hiding. Just
            clear objective diagnosis.
          </p>
          <ul className="grid gap-3">
            {values.map((v) => (
              <li
                key={v.label}
                className="flex items-center gap-3 font-medium text-sm"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <v.icon className="h-3 w-3" />
                </div>
                {v.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <ChatMockup>
            <ChatMockupMessage role="assistant" delay={0.5}>
              <div className="space-y-3">
                <p className="font-bold text-rose-600">Self-Audit Report:</p>
                <p>
                  Our assumption that "Long-form Guides" would win the "SEO
                  Automation" cluster was incorrect. High-intent competitors are
                  now winning with "Tool-first" utility pages.
                </p>
                <div className="rounded-xl border border-border bg-background/50 p-3 text-xs italic">
                  "I am pausing the current writing queue to restructure our
                  approach. We will move to a template-driven utility strategy."
                </div>
                <p>The logic is justified by a 40% shift in SERP features.</p>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
          <motion.div
            className="absolute -top-10 -left-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
