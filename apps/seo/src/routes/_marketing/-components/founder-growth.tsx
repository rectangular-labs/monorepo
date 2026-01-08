import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { Users, Check, Zap } from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

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
            Rankings don’t matter unless they drive leads, conversions, and
            trust. Fluid Posts aligns every action to real commercial intent.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[1.2fr,1fr] lg:items-center">
          <div className="relative">
            <ChatMockup className="border-primary/20 shadow-primary/5">
              <ChatMockupMessage from="assistant">
                I'm finishing the "Scale-Up SEO Strategy" article.
              </ChatMockupMessage>
              <ChatMockupTool
                title="Business Awareness Scan"
                output={
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded bg-emerald-50 px-2 py-1 font-bold text-[10px] text-emerald-600">
                      <Check className="h-3 w-3" /> Awareness Applied: B2B SaaS
                      Founders
                    </div>
                    <div className="space-y-2 text-[11px] text-muted-foreground">
                      <p>
                        • <strong>Organic Plug:</strong> Interjected "automated
                        reporting" feature mention into the 'Manual Audit'
                        section.
                      </p>
                      <p>
                        • <strong>Beyond Scope:</strong> Noticed high-volume
                        queries for "post-Series A SEO" - drafted follow-up
                        brief.
                      </p>
                      <p>
                        • <strong>Commercial Awareness:</strong> Switched to
                        'Founder-to-Founder' tone as per your product DNA.
                      </p>
                    </div>
                  </div>
                }
              />
              <ChatMockupMessage from="assistant">
                Every piece of content is written with an awareness of what you
                sell, who you sell to and why it matters. Ready to publish?
              </ChatMockupMessage>
            </ChatMockup>
            <motion.div
              className="absolute -top-10 -left-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-8">
            <div className="grid gap-6">
              {points.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-5 rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm backdrop-blur transition-colors hover:border-primary/20"
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
            <p className="border-primary/20 border-l-4 pl-6 font-bold text-primary text-xl italic leading-relaxed">
              "SEO that compounds business results — not just rankings."
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
