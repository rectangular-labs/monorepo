import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function FounderLongGame() {
  return (
    <Section className="border-border border-t bg-muted/20">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Sustainable Growth
          </p>
          <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Ready to win with your <br />
            <span className="font-semibold text-primary">SEO co-founder?</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl leading-relaxed">
            Real growth doesn’t come from perfect plans — it comes from fast,
            objective iteration. Fluid Posts operates without ego or blame.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[1.2fr,1fr] lg:items-center">
          <div className="relative">
            <ChatMockup className="border-primary/10 shadow-2xl">
              <ChatMockupMessage from="assistant" delay={0.5}>
                Ready to start gaining traction online? I have a plan ready for
                you.
              </ChatMockupMessage>
              <ChatMockupMessage from="user" delay={1}>
                Yes.
              </ChatMockupMessage>
              <ChatMockupMessage from="assistant" delay={1.5}>
                Let's get to work.
              </ChatMockupMessage>
              <ChatMockupTool
                state="input-streaming"
                title="Analysing Data & Surfaces Strategy"
                output="Mapping keyword gaps... Clustering commercial intent... Strategy justification complete."
                delay={2}
              />
            </ChatMockup>
            <motion.div
              className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <p className="text-muted-foreground text-xl leading-relaxed">
                Through early traction, plateaus, pivots, and breakthroughs, it
                stays aligned — reinforcing your brand, sharpening your
                strategy, and compounding what works.
              </p>
              <div className="space-y-4 border-primary/20 border-l-4 pl-6">
                <p className="font-bold text-2xl text-primary leading-tight">
                  End-to-end SEO, <br />
                  without the handoffs.
                </p>
                <p className="text-muted-foreground text-sm">
                  Strategy, ideation, planning, reporting, writing, and
                  publishing — all continuously aligned to your business goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
