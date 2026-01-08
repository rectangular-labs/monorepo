import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { Sparkles, Target, Zap } from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function Strategy() {
  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[7fr,5fr] lg:items-center">
        <div className="relative order-2 lg:order-1">
          <ChatMockup>
            <ChatMockupMessage from="assistant" delay={0.5}>
              <div className="space-y-4">
                <p>
                  I've surfaced 3 high-priority actions for the "Fluid Posts"
                  project:
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">
                        Winner: "SEO Automation"
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                        Top 3 page trending up (+15% visibility). Recommend
                        adding 3 internal links from high-authority posts.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Gap: "GEO Strategy"</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                        Uncovered 8 low-competition keywords in the Generative
                        Engine Optimization space.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Fix: "Content Audits"</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                        4 pages lost position due to intent drift. Ready for a
                        structural refresh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
          {/* Decorative breakthrough elements */}
          <motion.div
            className="absolute -top-10 -right-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <div className="space-y-2">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
              Continuous Momentum
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
              Always Ready with the <br />
              <span className="font-semibold text-primary">Next Win</span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fluid Posts is always working ahead of you — surfacing gaps to fill,
            winners to double down on, and underperformers to fix.
          </p>
          <p className="text-muted-foreground text-sm italic">
            So when you step in, the priorities are already clear, and the next
            win is already in motion.
          </p>
        </div>
      </div>
    </Section>
  );
}
