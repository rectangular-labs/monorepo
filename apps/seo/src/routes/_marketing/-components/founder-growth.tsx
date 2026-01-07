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
            Rankings don’t matter unless they drive leads and trust. Fluid Posts
            aligns every action to real commercial intent.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="grid gap-4">
              {[
                {
                  icon: Users,
                  title: "Leads over Traffic",
                  desc: "Prioritizes clusters that convert, not just high-volume vanity keywords.",
                },
                {
                  icon: Check,
                  title: "Natural Integration",
                  desc: "Integrates your product naturally into content to build trust and demand.",
                },
                {
                  icon: Zap,
                  title: "Leverage Finder",
                  desc: "Continuously looks for new SEO leverage points for your specific business model.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
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
          </div>

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
                This should increase lead conversion from this cluster by
                estimated 20% based on similar patterns.
              </ChatMockupMessage>
            </ChatMockup>
            <motion.div
              className="absolute -top-10 -right-10 -z-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
