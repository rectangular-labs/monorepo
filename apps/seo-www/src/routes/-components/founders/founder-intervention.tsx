import {
  AlertIcon,
  Check,
  EyeOn,
  RotateCcw,
} from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

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
          <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Intervene only{" "}
            <span className="font-semibold text-primary">where it counts</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl leading-relaxed">
            Founders shouldn't be micromanaging SEO. Fluid Posts handles
            auditing, planning, writing, and publishing — pulling you in only at
            critical moments.
          </p>
        </div>

        <div className="space-y-20">
          {interventionItems.map((item, i) => (
            <div
              className="grid gap-12 md:grid-cols-[1fr,1.2fr] md:items-center"
              key={item.title}
            >
              <div className="space-y-6">
                <motion.div
                  className="group flex items-start gap-5 rounded-2xl border border-border/50 bg-background/50 p-6 shadow-sm transition-colors hover:bg-muted/30"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground text-xl">
                      {item.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="relative">
                {i === 0 && (
                  <div className="space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/2 p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                      <Check className="h-3 w-3" /> Step 1: Strategic Direction
                    </div>
                    <div className="space-y-3 rounded-xl border border-emerald-500/10 bg-background p-4 shadow-sm">
                      <p className="font-bold text-xs">
                        Approve this overall strategy?
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Topical authority hub for{" "}
                        <strong>&quot;AI-assisted custom software&quot;</strong>
                        . Pivot: Funnel &quot;Examples&quot; into high-intent
                        asset pages.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          className="h-8 bg-emerald-600 text-[10px] hover:bg-emerald-700"
                          size="sm"
                        >
                          Approve & Start Outlines
                        </Button>
                        <Button
                          className="h-8 text-[10px]"
                          size="sm"
                          variant="outline"
                        >
                          Narrow to &quot;HVAC only&quot; first
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {i === 1 && (
                  <div className="space-y-4 rounded-3xl border border-blue-500/20 bg-blue-500/2 p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 font-bold text-[10px] text-blue-600 uppercase tracking-widest">
                      <EyeOn className="h-3 w-3" /> Step 2: Quality Scan
                    </div>
                    <ChatMockup className="border-blue-500/10 bg-background/80 shadow-none">
                      <ChatMockupMessage from="assistant">
                        <div className="space-y-3">
                          <p className="font-bold text-[11px]">
                            Draft Ready: &quot;The ROI of Fluid SEO&quot;
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Please review for brand alignment. Let me know if
                            any part of the logic feels misaligned with your
                            intent, or if we need a sharper tone tweak.
                          </p>
                          <div className="flex gap-2 border-blue-500/10 border-t pt-3">
                            <Button
                              className="h-7 border-blue-200 text-[9px] text-blue-700"
                              size="sm"
                              variant="outline"
                            >
                              Open in Editor
                            </Button>
                            <Button
                              className="h-7 bg-blue-600 text-[9px]"
                              size="sm"
                            >
                              Publish Now
                            </Button>
                          </div>
                        </div>
                      </ChatMockupMessage>
                    </ChatMockup>
                  </div>
                )}

                {i === 2 && (
                  <div className="space-y-4 rounded-3xl border border-rose-500/20 bg-rose-500/2 p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 font-bold text-[10px] text-rose-600 uppercase tracking-widest">
                      <AlertIcon className="h-3 w-3" /> Step 3: Drift Correction
                    </div>
                    <div className="space-y-3 rounded-xl border border-rose-500/10 bg-background p-4 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-[11px] text-rose-600">
                        <RotateCcw className="h-3.5 w-3.5" /> Prompting for
                        Intent
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        I&apos;ve detected our recent drafts are skewing too
                        technical. Should I recalibrate to a{" "}
                        <strong>C-Suite/Founder tone</strong> before generating
                        the next batch of outlines?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          className="h-8 border-rose-200 text-[10px] text-rose-700"
                          size="sm"
                          variant="outline"
                        >
                          Recalibrate Tone
                        </Button>
                        <Button
                          className="h-8 text-[10px]"
                          size="sm"
                          variant="ghost"
                        >
                          Ignore (Keep Tech Detail)
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl pt-12 text-center">
          <p className="border-primary/20 border-l-4 pl-6 font-medium text-muted-foreground text-xl italic">
            &quot;You stay close to the vision without being trapped in the
            weeds.&quot;
          </p>
        </div>
      </div>
    </Section>
  );
}
