import { Section } from "@rectangular-labs/ui/components/ui/section";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Target,
  BarChart3,
  Clock,
  Zap,
} from "@rectangular-labs/ui/components/icon";
import { cn } from "@rectangular-labs/ui/utils/cn";

export function Expertise() {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <Section className="border-border border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8 text-left">
          <div className="space-y-4">
            <p className="font-bold text-primary text-xs uppercase tracking-[0.4em]">
              Strategy First
            </p>
            <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-6xl">
              Never start strategy <br />
              <span className="font-semibold text-primary">
                from zero again
              </span>
            </h2>
            <p className="text-muted-foreground text-xl leading-relaxed">
              Fluid Posts analyzes keyword data, studies your industry, and
              surfaces data-backed strategic directions before you even ask.
            </p>
          </div>
          <div className="space-y-4 border-primary/20 border-l-2 pl-6 text-lg text-muted-foreground italic">
            "You start from a concrete thesis, ready to be shaped, approved, or
            challenged."
          </div>
        </div>

        <div className="relative">
          <ChatMockup className="min-h-[450px] shadow-2xl">
            <ChatMockupTool
              title="Autonomous Market Analysis"
              output="Analysed 4,500 keywords across 12 competitor domains. Found 3 untapped strategic clusters."
              delay={0.5}
            />
            <ChatMockupMessage from="assistant" delay={1}>
              <div className="space-y-4">
                <p className="text-sm">
                  I've justified a new high-impact strategy for{" "}
                  <strong>FluidPosts.com</strong>:
                </p>

                <button
                  type="button"
                  onClick={() => setShowDetail(!showDetail)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-all duration-300",
                    showDetail
                      ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                      : "border-border bg-background/50 hover:border-primary/50 hover:bg-background",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <p className="font-bold text-[11px]">
                        Thesis: "AI Execution Leadership"
                      </p>
                    </div>
                    <ArrowRight
                      className={cn(
                        "h-3 w-3 transition-transform",
                        showDetail && "rotate-90",
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {showDetail && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-4 border-border/50 border-t pt-4 text-[10px]">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="flex items-center gap-1.5 font-bold text-[8px] text-primary uppercase tracking-widest">
                                <Target className="h-2.5 w-2.5" /> Target
                                Keywords
                              </p>
                              <p className="text-muted-foreground">
                                "Enterprise SEO AI", "Automated Content
                                Execution", "AI SEO Workflows"
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="flex items-center gap-1.5 font-bold text-[8px] text-primary uppercase tracking-widest">
                                <BarChart3 className="h-2.5 w-2.5" /> Potential
                                Stats
                              </p>
                              <p className="text-muted-foreground">
                                +45% conversion probability vs generic "AI
                                Writing" terms.
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 font-bold text-[8px] text-primary uppercase tracking-widest">
                              <Zap className="h-2.5 w-2.5" /> Why we win
                            </p>
                            <p className="text-muted-foreground italic leading-relaxed">
                              Competitors focus on volume. By focusing on
                              "Execution Logic", we capture high-ACV clients who
                              value reliability.
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-[8px] text-muted-foreground uppercase tracking-tight">
                                Audit Schedule: 14 Days
                              </span>
                            </div>
                            <span className="font-bold text-[8px] text-emerald-600 uppercase">
                              Ready
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <p className="border-primary/20 border-l pl-2 text-[10px] text-muted-foreground italic">
                  Click the strategy to see keywords, stats, and expectations.
                </p>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
          <motion.div
            className="absolute -top-10 -left-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
