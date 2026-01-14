import {
  ChartBar,
  FileText,
  MoveRight,
  Search,
} from "@rectangular-labs/ui/components/icon";
import {
  Button,
  buttonVariants,
} from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { ONBOARD_LINK } from "../constants";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export const Hero = () => {
  return (
    <div className="relative flex min-h-screen w-full items-center bg-muted/30 lg:min-h-[calc(100vh-70px)]">
      <Section className="relative z-10 w-full max-w-none px-4 py-20 md:px-12 lg:py-32">
        <div className="mx-auto grid w-full items-center gap-16 lg:grid-cols-[1fr,1.2fr]">
          <div className="space-y-8 text-left">
            <div className="space-y-4">
              <h1 className="font-regular text-4xl text-foreground leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
                Move from SEO employee to <br />
                <span className="font-semibold text-primary">
                  decision-maker.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground leading-relaxed sm:text-2xl">
                Fluid Posts handles execution across audits, planning, writing,
                and reporting — leaving you to make the decisions that matter.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                className={buttonVariants({
                  className: "h-12 gap-3 px-8 text-lg",
                  size: "lg",
                })}
                href={ONBOARD_LINK}
                rel="noopener"
                target="_blank"
              >
                Join the waitlist <MoveRight className="h-5 w-5" />
              </a>
              <p className="font-medium text-muted-foreground text-sm">
                Launching End-Jan 2026
              </p>
            </div>
          </div>
          <div className="relative w-full">
            <ChatMockup className="border-primary/10 bg-background/80 shadow-primary/10 backdrop-blur-2xl">
              <div className="mb-4 flex items-center gap-2 font-bold text-[10px] text-primary uppercase tracking-widest">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Onboarding: Client 'AIAppBuilder'
              </div>
              <ChatMockupMessage delay={0.5} from="assistant">
                Onboarding complete. I've finished crawling{" "}
                <strong>aiappbuilder.example</strong> and analysing their
                competitors. I now have a deep understanding of their business
                model and current SEO standing.
              </ChatMockupMessage>
              <ChatMockupMessage delay={1.5} from="assistant">
                I've identified a significant gap in their "AI Integration"
                cluster. I'm ready to treat you like the boss. What would you
                like me to do next?
              </ChatMockupMessage>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="h-8 gap-2 border-primary/20 text-[10px] hover:bg-primary/5"
                  size="sm"
                  variant="outline"
                >
                  <ChartBar className="h-3 w-3" /> Generate Historical Report
                </Button>
                <Button
                  className="h-8 gap-2 border-primary/20 text-[10px] hover:bg-primary/5"
                  size="sm"
                  variant="outline"
                >
                  <Search className="h-3 w-3" /> Review Strategy
                </Button>
                <Button
                  className="h-8 gap-2 border-primary/20 text-[10px] hover:bg-primary/5"
                  size="sm"
                  variant="outline"
                >
                  <FileText className="h-3 w-3" /> Write Articles
                </Button>
              </div>
            </ChatMockup>

            {/* Decorative breakthrough elements */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              className="absolute -right-10 -bottom-10 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
              className="absolute -top-10 -left-10 -z-10 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl"
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>
        </div>
      </Section>
    </div>
  );
};
