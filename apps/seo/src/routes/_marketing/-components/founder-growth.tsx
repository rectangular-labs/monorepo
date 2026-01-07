import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  Check,
  Zap,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function FounderGrowth() {
  return (
    <Section className="border-border border-t bg-primary/[0.02]">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Commercial ROI
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Built to{" "}
            <span className="font-semibold text-primary">
              grow your business
            </span>
            ,
            <br />
            not just your website
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Rankings don’t matter unless they drive leads, conversions, and trust. 
            Fluid Posts aligns every action to real commercial intent.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[7fr,5fr] lg:items-center">
          <div className="relative">
            <ChatMockup>
              <ChatMockupMessage role="assistant" delay={0.5}>
                I'm updating our "Enterprise SEO" guide. Instead of just
                explaining the concept, I've integrated a "Product Spotlight"
                section showing how Fluid Posts solves the audit-to-execution
                gap naturally.
              </ChatMockupMessage>
              <ChatMockupTool
                title="Commercial Intent Optimization"
                output="Added 3 natural product CTAs. Restructured intro to focus on 'Business ROI' over 'Keyword Density'."
                delay={1}
              />
              <ChatMockupMessage role="assistant" delay={1.5}>
                Every piece of content is now written with an awareness of what 
                you sell, who you sell to, and why it matters. 
              </ChatMockupMessage>
            </ChatMockup>
            <motion.div
              className="absolute -top-10 -right-10 -z-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-6">
            <div className="grid gap-6">
              {[
                {
                  icon: Users,
                  title: "Organic Product Integration",
                  desc: "Plugs your services and products organically within content to drive real leads.",
                },
                {
                  icon: Zap,
                  title: "Beyond the Scope",
                  desc: "Continuously looks for opportunities for wins outside of its current scope.",
                },
                {
                  icon: Check,
                  title: "Commercial Awareness",
                  desc: "Every piece is written with an awareness of what you sell and why it matters.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-lg font-bold text-primary italic">
              SEO that compounds business results — not just rankings.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
