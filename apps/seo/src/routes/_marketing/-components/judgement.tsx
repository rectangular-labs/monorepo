import { Section } from "@rectangular-labs/ui/components/ui/section";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function Judgement() {
  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto max-w-6xl gap-16 lg:grid lg:grid-cols-[5fr,7fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
              Expert-in-the-loop
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
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
            <ChatMockupMessage from="assistant" delay={0.5}>
              I've drafted the outline for the "Enterprise SEO Strategy" piece.
              I've focused on the technical requirements for multi-tenant
              architectures as you requested.
            </ChatMockupMessage>
            <ChatMockupTool
              title="Review Required: Content Outline"
              output="Section 1: The Multi-tenant Challenge. Section 2: Data Isolation & Crawling. Section 3: Performance at Scale."
              delay={1}
            />
            <ChatMockupMessage from="user" delay={1.5}>
              The structure is good, but let's lean more into the security
              implications of shared data in Section 2.
            </ChatMockupMessage>
            <ChatMockupMessage from="assistant" delay={2}>
              Understood. Updating the Section 2 thinking to prioritize
              security-first architecture. Ready for next step?
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
    </Section>
  );
}
