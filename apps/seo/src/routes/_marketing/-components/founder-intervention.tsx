import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { Check, EyeOn, AlertIcon } from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function FounderIntervention() {
  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl gap-16 lg:grid lg:grid-cols-[1fr,1fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
              Efficiency
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
              Intervene only{" "}
              <span className="font-semibold text-primary">
                where it counts
              </span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Founders shouldn’t be micromanaging SEO. Fluid Posts runs end-to-end
            — auditing, planning, writing, and publishing — while pulling you in
            only at critical moments.
          </p>
          <div className="space-y-4">
            {[
              { icon: Check, text: "Approving strategic direction" },
              { icon: EyeOn, text: "Reviewing outputs before they go live" },
              { icon: AlertIcon, text: "Correcting misunderstandings early" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 font-medium">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                {item.text}
              </div>
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
              series. I need your eyes on the core strategic direction before I
              start the end-to-end execution.
            </ChatMockupMessage>
            <ChatMockupTool
              title="Strategic Direction Review"
              output="Focus: Long-term authority over quick-win hacks. Tone: Direct & No-BS."
              delay={1}
            />
            <ChatMockupMessage role="user" delay={1.5}>
              Approved. Make sure to emphasize the accountability part in the
              third article.
            </ChatMockupMessage>
            <ChatMockupMessage role="assistant" delay={2}>
              Understood. Executing all 5 articles now. I'll alert you when the
              final drafts are ready for review.
            </ChatMockupMessage>
          </ChatMockup>
        </div>
      </div>
    </Section>
  );
}
