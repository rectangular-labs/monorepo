import {
  Check,
  Globe,
  PenTool,
  Search,
  Send,
  Sparkles,
} from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";

function SolidArrowDownIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Down</title>
      <path
        d="M9.25 2.75a.75.75 0 0 1 1.5 0v9.44l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3.75 3.75a.75.75 0 0 1-1.06 0l-3.75-3.75a.75.75 0 1 1 1.06-1.06l2.47 2.47V2.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SolidArrowRightIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Right</title>
      <path
        d="M2.75 9.25a.75.75 0 0 0 0 1.5h9.44l-2.47 2.47a.75.75 0 1 0 1.06 1.06l3.75-3.75a.75.75 0 0 0 0-1.06l-3.75-3.75a.75.75 0 1 0-1.06 1.06l2.47 2.47H2.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SolidArrowLeftIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Left</title>
      <path
        d="M17.25 10a.75.75 0 0 0-.75-.75H7.06l2.47-2.47a.75.75 0 1 0-1.06-1.06L4.72 9.47a.75.75 0 0 0 0 1.06l3.75 3.75a.75.75 0 0 0 1.06-1.06L7.06 10.75h9.44a.75.75 0 0 0 .75-.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FounderWhatItIs() {
  const Step = ({
    icon: Icon,
    title,
  }: {
    icon: typeof Globe;
    title: string;
  }) => (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-xs">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-bold text-[13px] text-foreground leading-tight">
        {title}
      </p>
    </div>
  );

  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="space-y-5 text-left">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            What we do
          </p>
          <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Strategist, writer and publisher — all yours in 3 minutes
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
            Drop your URL and Fluid Posts analyzes your brand, researches
            keyword strategy and writes articles for you, and publishes straight
            to your CMS.
          </p>
        </div>

        {/* Visual flow */}
        <div className="relative">
          <div className="rounded-3xl border border-border bg-background p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[10px] text-primary uppercase tracking-widest">
                <Sparkles className="h-3 w-3" /> 3-minute setup
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-700">
                <Check className="h-3 w-3" />
                Ready
              </div>
            </div>

            <div className="flex items-center justify-center py-1">
              <div className="w-full max-w-[320px]">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex justify-center">
                    <Step icon={Globe} title="Drop URL" />
                  </div>
                  <div className="text-primary">
                    <SolidArrowRightIcon />
                  </div>
                  <div className="flex justify-center">
                    <Step icon={Search} title="Strategise" />
                  </div>

                  <div />
                  <div />
                  <div className="flex justify-center text-primary">
                    <SolidArrowDownIcon />
                  </div>

                  <div className="flex justify-center">
                    <Step icon={Send} title="Publish" />
                  </div>
                  <div className="text-primary">
                    <SolidArrowLeftIcon />
                  </div>
                  <div className="flex justify-center">
                    <Step icon={PenTool} title="Write" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.6, 0.35] }}
            className="absolute -right-10 -bottom-10 -z-10 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
            transition={{ duration: 7, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
