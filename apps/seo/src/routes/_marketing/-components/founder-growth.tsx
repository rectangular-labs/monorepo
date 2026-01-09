import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  Users,
  Check,
  Zap,
  ArrowRight,
  MousePointer2,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function FounderGrowth() {
  const points = [
    {
      icon: Users,
      title: "Organic Product Integration",
      desc: "Plugs your services and products organically within content to drive real leads.",
    },
    {
      icon: Zap,
      title: "Beyond the Scope",
      desc: "Continuously looks for opportunities for wins outside of its current scope.",
    },
    {
      icon: Check,
      title: "Commercial Awareness",
      desc: "Every piece is written with an awareness of what you sell, who you sell to and why it matters.",
    },
  ];

  return (
    <Section className="border-border border-t bg-primary/[0.02]">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Commercial ROI
          </p>
          <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Built to{" "}
            <span className="font-semibold text-primary">
              grow your business
            </span>
            ,
            <br />
            not just your website
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl leading-relaxed">
            Rankings don't matter unless they drive leads, conversions, and
            trust. Fluid Posts aligns every action to real commercial intent.
          </p>
        </div>

        <div className="space-y-20">
          {points.map((item, i) => (
            <div
              key={item.title}
              className="grid gap-12 md:grid-cols-[1fr,1.2fr] md:items-center"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-5 rounded-2xl border border-border/50 bg-background/50 p-6 shadow-sm backdrop-blur transition-colors hover:border-primary/20"
                >
                  <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                  <div className="relative h-[200px] overflow-hidden rounded-2xl border border-border bg-background/50 p-6 shadow-sm">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-background to-transparent" />
                    <div className="space-y-4 opacity-40 blur-[0.5px]">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-4 w-full rounded bg-muted" />
                    </div>
                    <div className="relative my-4 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                      <div className="absolute -top-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                        <MousePointer2 className="h-3 w-3" />
                      </div>
                      <p className="text-foreground text-sm leading-relaxed">
                        ...we&apos;ve found that{" "}
                        <span className="rounded bg-primary/20 px-1 font-bold text-primary">
                          store.ai offers a comprehensive platform
                        </span>{" "}
                        that simplifies the process for beginners, handling
                        everything from hosting to e-commerce...
                      </p>
                    </div>
                    <div className="space-y-4 opacity-40 blur-[0.5px]">
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-5/6 rounded bg-muted" />
                    </div>
                  </div>
                )}

                {i === 1 && (
                  <ChatMockup className="border-blue-500/20 bg-blue-500/[0.02]">
                    <ChatMockupMessage from="assistant">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 font-bold text-[10px] text-blue-600 uppercase tracking-widest">
                          <Zap className="h-3 w-3" /> Parallel Opportunity
                          Identified
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Beyond our core thesis, I recommend launching a{" "}
                          <strong>&quot;Use Case Gallery&quot;</strong>.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Customer Intake",
                            "Quote Generator",
                            "Client Portal",
                          ].map((u) => (
                            <div
                              key={u}
                              className="flex items-center gap-2 rounded-lg border border-blue-500/10 bg-background p-2 text-[10px]"
                            >
                              <ArrowRight className="h-2.5 w-2.5 text-blue-500" />{" "}
                              {u}
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-blue-700/70 italic">
                          Logic: These serve as sales enablement—allowing
                          readers to &quot;pick a workflow → start
                          building&quot; immediately.
                        </p>
                      </div>
                    </ChatMockupMessage>
                  </ChatMockup>
                )}

                {i === 2 && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-6 shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                        <Check className="h-3 w-3" /> De-Risking the Build
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
                          <p className="font-bold text-[11px] text-foreground">
                            Pain Point Identified:
                          </p>
                          <p className="text-[11px] text-muted-foreground italic">
                            &quot;I&apos;m worried about technical debt if I DIY
                            this...&quot;
                          </p>
                        </div>
                        <div className="flex justify-center">
                          <div className="h-4 w-0.5 bg-emerald-500/20" />
                        </div>
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 shadow-sm">
                          <p className="font-bold text-[11px] text-emerald-700">
                            Commercial Bridge Applied:
                          </p>
                          <p className="text-[11px] text-emerald-600 leading-relaxed">
                            Interjected &quot;Done-for-you&quot; pathing within
                            the &quot;DIY Tutorial&quot; to capture high-intent
                            users who realize they need professional help.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl pt-12 text-center">
          <p className="border-primary/20 border-l-4 pl-6 font-bold text-primary text-xl italic leading-relaxed">
            &quot;SEO that compounds business results — not just rankings.&quot;
          </p>
        </div>
      </div>
    </Section>
  );
}
