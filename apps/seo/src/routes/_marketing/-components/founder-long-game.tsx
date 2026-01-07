import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function FounderLongGame() {
  return (
    <Section className="border-border border-t bg-muted/20">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Sustainable Growth
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Your co-founder for the{" "}
            <span className="font-semibold text-primary">long game</span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Real growth doesn’t come from perfect plans — it comes from fast,
            objective iteration. Fluid Posts operates without ego or blame,
            using real signals to adjust direction as your business evolves.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <ChatMockup>
            <ChatMockupMessage role="assistant" delay={0.5}>
              We've reached a traffic plateau in the "Founders" cluster.
              Competitor 'X' has launched a new interactive tool that's sucking
              up SERP intent. I'm pivoting our next 3 pieces to focus on
              "Comparison" intent to intercept that traffic.
            </ChatMockupMessage>
            <ChatMockupTool
              state="input-streaming"
              title="Iterative Strategy Pivot"
              output="Analysing competitor signal... Restructuring roadmap... Ready for alignment."
              delay={1}
            />
            <ChatMockupMessage role="assistant" delay={1.5}>
              This is the 4th pivot based on live signals this quarter. We're
              staying ahead of the drift.
            </ChatMockupMessage>
          </ChatMockup>
          <motion.div
            className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>

        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <p className="text-lg text-muted-foreground">
            Through early traction, plateaus, pivots, and breakthroughs, it
            stays aligned — reinforcing your brand, sharpening your strategy,
            and compounding what works.
          </p>
          <p className="font-bold text-primary text-xl">
            End-to-end SEO, without the handoffs.
          </p>
        </div>
      </div>
    </Section>
  );
}
