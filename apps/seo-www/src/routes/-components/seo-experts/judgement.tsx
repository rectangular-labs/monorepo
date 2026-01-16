import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function Judgement() {
  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h2 className="font-regular text-4xl text-foreground leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
            Limitless output, <br />
            <span className="font-semibold text-primary">
              anchored by your judgement
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fluid Posts is designed around the reality that automation works
            best when guided by an expert. You’re always in the loop - approving
            and defining the strategy, structure the thinking, and approving
            outlines and reviewing the final output.
          </p>
        </div>

        <div className="relative">
          <ChatMockup>
            <ChatMockupMessage delay={0.5} from="assistant">
              I have 5 article outlines ready for your review.
            </ChatMockupMessage>
            <ChatMockupTool
              delay={1}
              output={[
                "1) AI MVP Scope Checklist (Cost + Timeline)",
                "2) AI App Builder vs Custom Build (Decision Guide)",
                "3) MVP Tech Stack for SMBs (Pragmatic Defaults)",
                "4) Internal Tools Examples for Service Businesses",
                "5) Common SEO Reporting Mistakes (and Fixes)",
              ].join("\n")}
              title="Review Required: 5 Article Outlines"
            />
          </ChatMockup>
          {/* Decorative breakthrough elements */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
