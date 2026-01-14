import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function Judgement() {
  return (
    <Section className="max-w-none border-border border-t bg-background">
      <div className="mx-auto grid w-full gap-16 px-4 md:px-12 lg:grid lg:grid-cols-[5fr,7fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-regular text-4xl text-foreground leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
              Limitless output, <br />
              <span className="font-semibold text-primary">
                anchored by your judgement
              </span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fluid Posts is designed around the reality that automation works
            best when guided by an expert. You’re always in the loop - approving
            and defining the strategy, structure the thinking, and approving
            outlines and reviewing the final output.
          </p>
          <p className="text-muted-foreground text-sm italic">
            Fluid Posts handles the execution — reducing errors, avoiding drift,
            and ensuring loyalty to your vision.
          </p>
        </div>

        <div className="relative">
          <ChatMockup>
            <ChatMockupMessage delay={0.5} from="assistant">
              I've drafted the outline for the "Enterprise SEO Strategy" piece.
              I've focused on the technical requirements for multi-tenant
              architectures as you requested.
            </ChatMockupMessage>
            <ChatMockupTool
              delay={1}
              output="Section 1: The Multi-tenant Challenge. Section 2: Data Isolation & Crawling. Section 3: Performance at Scale."
              title="Review Required: Content Outline"
            />
            <ChatMockupMessage delay={1.5} from="user">
              The structure is good, but let's lean more into the security
              implications of shared data in Section 2.
            </ChatMockupMessage>
            <ChatMockupMessage delay={2} from="assistant">
              Understood. Updating the Section 2 thinking to prioritize
              security-first architecture. Ready for next step?
            </ChatMockupMessage>
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
