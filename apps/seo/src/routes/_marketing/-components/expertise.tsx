import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  Check,
  User,
  Zap,
  Sparkles,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function Expertise() {
  return (
    <Section className="border-border border-t bg-muted/30">
      <div className="mx-auto max-w-6xl gap-16 lg:grid lg:grid-cols-[1fr,1fr] lg:items-center">
        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <p className="font-bold text-primary text-xs uppercase tracking-[0.4em]">
              Strategy First
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
              Never start SEO/GEO strategy <br />
              <span className="font-semibold text-primary">
                from zero again
              </span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fluid Posts does the first pass on SEO strategy before you even ask.
            It analyses keyword data, studies your site and industry, and
            surfaces opportunities in clear clusters, theses and strategic
            directions - all grounded in real data.
          </p>
          <p className="text-muted-foreground text-sm italic">
            You start from a concrete, data-backed strategy, ready to be shaped,
            approved, or challenged.
          </p>
        </div>

        <div className="relative">
          <ChatMockup>
            <ChatMockupTool
              title="Market Analysis Complete"
              output="Analysed 4,500 keywords across 12 competitor domains. Found 3 untapped strategic clusters."
              delay={0.5}
            />
            <ChatMockupMessage role="assistant" delay={1}>
              <div className="space-y-4">
                <p>
                  I've drafted a new strategy for{" "}
                  <strong>FluidPosts.com</strong> focusing on the "AI Workflow
                  Automation" cluster.
                </p>
                <div className="rounded-xl border border-border bg-background/50 p-3 text-xs">
                  <p className="font-bold text-primary">Strategic Thesis:</p>
                  <p className="mt-1">
                    Transition from "AI Writing" to "AI Execution" to capture
                    high-intent enterprise leads who are tired of manual SEO
                    management.
                  </p>
                </div>
                <p>Should I generate the content roadmap for this thesis?</p>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
          {/* Decorative breakthrough elements */}
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
