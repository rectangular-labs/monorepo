import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { buttonVariants } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { lazy, Suspense } from "react";
import { ONBOARD_LINK } from "./constants";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

const CrowdCanvas = lazy(() =>
  import("@rectangular-labs/ui/components/background/crowd").then((m) => ({
    default: m.CrowdCanvas,
  })),
);

export const Hero = () => {
  return (
    <div className="relative min-h-screen w-full lg:min-h-[calc(100vh-70px)]">
      <Section className="relative z-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[7fr,5fr]">
          <div className="space-y-6 text-left">
            <h1 className="font-regular text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
              Move from SEO employee to <br />
              <span className="font-semibold text-primary">
                decision-maker.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Fluid Posts handles execution across audits, planning, writing,
              and reporting — leaving you to make the decisions that matter.
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
                Launching in End-Jan 2026
              </p>
            </div>
          </div>
          <div className="relative w-full">
            <ChatMockup>
              <ChatMockupMessage from="assistant" delay={0.5}>
                I've completed the morning sweep. We have 3 new content
                opportunities and a performance update on your 'AI tools'
                cluster. Ready for your review?
              </ChatMockupMessage>
              <ChatMockupTool
                title="Weekly Report Generated"
                output="Traffic up 12% in targeted clusters. Drafted 5 new briefs based on current SERP shifts."
                delay={1}
              />
              <ChatMockupMessage from="user" delay={1.5}>
                Approve the briefs. Let's focus on the 'Enterprise' intent.
              </ChatMockupMessage>
              <ChatMockupTool
                state="input-streaming"
                title="Writing Content"
                input="Cluster: Enterprise SaaS, Voice: Professional & Authoritative"
                delay={2}
              />
            </ChatMockup>

            {/* Decorative breakthrough elements */}
            <motion.div
              className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
        </div>
      </Section>
      <Suspense fallback={null}>
        <CrowdCanvas
          className="absolute inset-0 -z-10 opacity-60"
          cols={7}
          rows={15}
          src="/peeps.png"
        />
      </Suspense>
    </div>
  );
};
