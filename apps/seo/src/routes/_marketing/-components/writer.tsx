import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { Check, FileText } from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function Writer() {
  return (
    <Section className="border-border border-t bg-muted/20">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Scale Without Limits
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Your{" "}
            <span className="font-semibold text-primary">
              Writing Team, at Your Fingertips.
            </span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Approve, and it goes to work. Fluid Posts writes in your brand’s
            voice, grounded in fulfilling real search intent.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <ChatMockup>
              <ChatMockupMessage from="user" delay={0.5}>
                Approve the roadmap. Let's start with the "AI Workflow for
                Enterprise" guide.
              </ChatMockupMessage>
              <ChatMockupTool
                state="input-streaming"
                title="Analysing SERPs & AI Overviews"
                output="Identifying key information gaps and utility requirements for 'Enterprise' intent..."
                delay={1}
              />
              <ChatMockupTool
                state="output-available"
                title="Drafting Content"
                output={
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="h-3 w-3" />
                      <span className="font-bold">
                        Enterprise_Workflow_Guide_v1.md
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-bold text-[8px] text-emerald-600 uppercase">
                        SEO Optimized
                      </div>
                      <div className="rounded bg-blue-500/10 px-1.5 py-0.5 font-bold text-[8px] text-blue-600 uppercase">
                        GEO Ready
                      </div>
                      <div className="rounded bg-amber-500/10 px-1.5 py-0.5 font-bold text-[8px] text-amber-600 uppercase">
                        Brand Voice: Applied
                      </div>
                    </div>
                  </div>
                }
                delay={1.5}
              />
              <ChatMockupMessage from="assistant" delay={2}>
                The first draft is ready. I've focused on visibility across
                traditional search and AI-driven discovery (GEO). Ready for your
                review?
              </ChatMockupMessage>
            </ChatMockup>
            {/* Decorative breakthrough elements */}
            <motion.div
              className="absolute -bottom-10 -left-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-2xl tracking-tight">
              Output that scales <br />
              <span className="font-normal text-primary italic">
                without a ceiling.
              </span>
            </h3>
            <div className="space-y-4">
              {[
                "Search intent uncovered through analysis of top-ranking SERPs and AI overviews",
                "Focused, clearly structured writing that prioritises usefulness and readability",
                "SEO and GEO applied intentionally and effectively",
                "Built for visibility across traditional search and AI-driven discovery",
              ].map((item) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4 shadow-sm"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm leading-relaxed">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
