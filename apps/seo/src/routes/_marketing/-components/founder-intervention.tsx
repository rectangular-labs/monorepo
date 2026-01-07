import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { Check, EyeOn, AlertIcon } from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";
import { Button } from "@rectangular-labs/ui/components/ui/button";

export function FounderIntervention() {
  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Efficiency
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Intervene only{" "}
            <span className="font-semibold text-primary">
              where it counts
            </span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Founders shouldn’t be micromanaging SEO. Fluid Posts runs end-to-end
            — auditing, planning, writing, and publishing — while pulling you in
            only at critical moments.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="grid gap-4">
              {[
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
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-muted-foreground text-sm italic">
              You stay close to the vision without being trapped in the weeds.
            </p>
          </div>

          <div className="relative">
            <ChatMockup>
              <ChatMockupMessage role="assistant" delay={0.5}>
                I've prepared the content roadmap for the "AI for Founders"
                series. Everything is aligned to our lead-gen goals. Ready for
                your review?
              </ChatMockupMessage>
              <ChatMockupTool
                title="Strategic Direction Review"
                output={
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Strategic Intent:</p>
                      <p className="text-xs leading-relaxed">Focus on "Operational Efficiency" over "Cost Savings" to attract series B+ founders.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check className="h-3 w-3" /> Approve Direction
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-2">
                        <AlertIcon className="h-3 w-3" /> Needs Revision
                      </Button>
                    </div>
                  </div>
                }
                delay={1}
              />
              <ChatMockupMessage role="assistant" delay={1.5}>
                Once approved, I'll handle the end-to-end execution across all
                5 articles automatically.
              </ChatMockupMessage>
            </ChatMockup>
          </div>
        </div>
      </div>
    </Section>
  );
}
