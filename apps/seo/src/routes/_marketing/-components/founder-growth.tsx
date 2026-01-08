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
                <ChatMockup className="border-primary/20 shadow-primary/5">
                  <ChatMockupMessage from="assistant">
                    {i === 0 &&
                      "I'm optimizing the 'Enterprise SEO Guide' to mention your 'Audit API' as the primary solution."}
                    {i === 1 &&
                      "Found a trending discussion on LinkedIn about 'Post-AI Content'. Drafting a response thesis."}
                    {i === 2 &&
                      "The 'Strategy' page now emphasizes your fixed-price model to align with target audience preferences."}
                  </ChatMockupMessage>
                  <ChatMockupTool
                    title={
                      i === 0
                        ? "Product Integration Scan"
                        : i === 1
                          ? "Opportunity Detection"
                          : "Commercial Voice Check"
                    }
                    output={
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded bg-emerald-50 px-2 py-1 font-bold text-[10px] text-emerald-600">
                          <Check className="h-3 w-3" />
                          {i === 0 && "Applied: Internal Product Linking"}
                          {i === 1 && "Applied: Trend Exploitation"}
                          {i === 2 && "Applied: Persona Alignment"}
                        </div>
                        <div className="text-[11px] text-muted-foreground italic">
                          {i === 0 &&
                            "• Injected 'Audit API' into 'Scalability' section."}
                          {i === 1 &&
                            "• Drafting 1,200 words on 'Why Humans Still Matter'."}
                          {i === 2 &&
                            "• Switched tone from 'Technical' to 'C-Suite Strategy'."}
                        </div>
                      </div>
                    }
                  />
                </ChatMockup>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl pt-12 text-center">
          <p className="border-primary/20 border-l-4 pl-6 font-bold text-primary text-xl italic leading-relaxed">
            "SEO that compounds business results — not just rankings."
          </p>
        </div>
      </div>
    </Section>
  );
}
