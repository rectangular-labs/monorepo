import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { Check, EyeOn, AlertIcon } from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";
import { Button } from "@rectangular-labs/ui/components/ui/button";

export function FounderIntervention() {
  const interventionItems = [
    {
      title: "Approving Strategic Direction",
      desc: "One click to greenlight a new cluster or a major pivot in thinking.",
      icon: Check,
    },
    {
      title: "Reviewing Outputs",
      desc: "Quickly scan the logic and brand voice before content goes live.",
      icon: EyeOn,
    },
    {
      title: "Correcting Misunderstandings",
      desc: "Catch and fix any drift in intent before it turns into wrong output.",
      icon: AlertIcon,
    },
  ];

  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Efficiency
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Intervene only{" "}
            <span className="font-semibold text-primary">where it counts</span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Founders shouldn’t be micromanaging SEO. Fluid Posts runs end-to-end
            — auditing, planning, writing, and publishing — while pulling you in
            only at critical moments.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="grid gap-4">
              {interventionItems.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-5 rounded-2xl p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-lg">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="border-primary/20 border-l-4 pl-6 font-medium text-muted-foreground text-xl italic">
              You stay close to the vision without being trapped in the weeds.
            </p>
          </div>

          <div className="relative">
            <ChatMockup className="border-primary/20 bg-primary/[0.01]">
              <ChatMockupMessage from="assistant">
                Strategic shift detected: Competitor 'GrowthHub' is pivoting to
                enterprise. I recommend a counter-pivot.
              </ChatMockupMessage>
              <ChatMockupTool
                title="Strategic Approval Required"
                output={
                  <div className="space-y-5">
                    <div className="space-y-2 border-emerald-500 border-l-2 pl-3">
                      <p className="font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                        Decision Point:
                      </p>
                      <p className="font-medium text-[11px] leading-relaxed">
                        Pivot 'How-To' guides into 'Enterprise Implementation
                        Frameworks' to compete for higher ACV leads.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="h-9 gap-2 bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" /> Approve Strategic Shift
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <EyeOn className="h-4 w-4" /> Review Data Justification
                      </Button>
                    </div>
                  </div>
                }
              />
              <ChatMockupTool
                title="Content Review"
                output={
                  <div className="space-y-4">
                    <div className="space-y-2 border-blue-500 border-l-2 pl-3">
                      <p className="font-bold text-[10px] text-blue-600 uppercase tracking-widest">
                        Output Prepared:
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-[11px]">
                          Article: "The ROI of Fluid SEO for CEOs"
                        </p>
                        <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 font-bold text-[9px] text-blue-600">
                          Draft Complete
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <EyeOn className="h-3 w-3" /> Quick Review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <AlertIcon className="h-3 w-3" /> Correct Intent Drift
                      </Button>
                    </div>
                  </div>
                }
              />
            </ChatMockup>
            <motion.div
              className="absolute -top-10 -right-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
