import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { TrendingUp } from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function Reporting() {
  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="grid gap-16 lg:grid-cols-[5fr,7fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
                Deep Insights
              </p>
              <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
                Turn SEO reporting into your <br />
                <span className="font-semibold text-primary">
                  unfair advantage.
                </span>
              </h2>
            </div>
            <p className="text-muted-foreground text-xl leading-relaxed">
              See what others miss. Fluid Posts briefs you at a glance —
              analysing performance of any cluster with:
            </p>
            <ul className="space-y-3">
              {[
                "What’s working",
                "What isn’t",
                "Why – backed by real signals and data",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="font-bold text-primary text-sm italic">
              It’s unfair to have this level of clarity on demand.
            </p>
          </div>

          <div className="relative">
            <ChatMockup>
              <ChatMockupMessage from="assistant" delay={0.5}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Weekly Performance Brief: Content Clusters
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <p className="text-[10px] text-emerald-600 uppercase tracking-wider">
                        Working
                      </p>
                      <p className="mt-1 font-bold text-lg">+24%</p>
                      <p className="text-[10px] text-muted-foreground">
                        "SaaS Workflows"
                      </p>
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                      <p className="text-[10px] text-rose-600 uppercase tracking-wider">
                        Attention
                      </p>
                      <p className="mt-1 font-bold text-lg">-8%</p>
                      <p className="text-[10px] text-muted-foreground">
                        "SEO Tips"
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="font-bold text-xs">Why?</p>
                    <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                      "SEO Tips" cluster is seeing a 40% shift in SERP intent
                      towards AI-Overview-first answers. We need to restructure
                      these 4 pages to prioritize direct utility.
                    </p>
                  </div>
                  <p className="text-xs">
                    This report is ready to be client-facing. Should I send it
                    or do you need any changes?
                  </p>
                </div>
              </ChatMockupMessage>
              <ChatMockupMessage from="user" delay={1.5}>
                Looks good. Add a note about the new "AI Workflow" strategy
                we're starting next week.
              </ChatMockupMessage>
            </ChatMockup>
            {/* Decorative breakthrough elements */}
            <motion.div
              className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
