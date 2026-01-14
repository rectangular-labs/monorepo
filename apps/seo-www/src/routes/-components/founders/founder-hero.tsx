import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { buttonVariants } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";
import { ONBOARD_LINK } from "./constants";

export const FounderHero = () => {
  return (
    <Section className="relative z-10">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[7fr,5fr]">
        <div className="space-y-6 text-left">
          <h1 className="font-regular text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
            Your{" "}
            <span className="font-semibold text-primary">SEO co-founder.</span>
            <br />
            On your side. Thinking like you.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
            Fluid Posts is an end-to-end SEO system built for founders — not
            agencies, not vanity metrics, not output for output’s sake. It
            thinks like a business owner: self-critical, data-driven, and
            focused on growth.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              className={buttonVariants({
                className: "gap-3",
                size: "lg",
              })}
              href={ONBOARD_LINK}
              rel="noopener"
              target="_blank"
            >
              Join the waitlist <MoveRight className="h-4 w-4" />
            </a>
            <p className="font-medium text-muted-foreground text-sm">
              Launching end-Jan 2026
            </p>
          </div>
        </div>
        <div className="relative w-full">
          <ChatMockup>
            <ChatMockupMessage from="assistant" delay={0.5}>
              I've reviewed our latest conversion data. While traffic to our
              "SEO Tips" cluster is up, it's not driving leads. I'm pivoting our
              strategy to focus on "Enterprise SEO Workflows" which has a 3x
              higher commercial intent.
            </ChatMockupMessage>
            <ChatMockupTool
              title="Commercial Intent Audit"
              output="Identified 14 high-traffic pages with low lead conversion. Recommend structural pivot."
              delay={1}
            />
            <ChatMockupMessage from="user" delay={1.5}>
              Agreed. We need leads, not just eyeballs. Show me the new thesis.
            </ChatMockupMessage>
          </ChatMockup>
          <motion.div
            className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
};
