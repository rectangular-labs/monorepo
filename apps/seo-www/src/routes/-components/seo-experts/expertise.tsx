import {
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  FileText,
  Target,
  Zap,
} from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChatMockup, ChatMockupTool } from "./chat-mockup";

export function Expertise() {
  const [showDetail, setShowDetail] = useState(true);

  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 text-center">
        <div className="space-y-6">
          <h2 className="font-regular text-4xl text-foreground leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
            Never start strategy <br />
            <span className="font-semibold text-primary">from zero again</span>
          </h2>
          <p className="mx-auto max-w-3xl text-muted-foreground text-xl leading-relaxed">
            Fluid Posts analyzes keyword data, studies your industry, and
            surfaces data-backed strategic directions before you even ask.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-4xl">
          <ChatMockup className="min-h-[450px] text-left shadow-2xl">
            <ChatMockupTool
              delay={0.5}
              output="Analysed 4,500 keywords across 12 competitor domains. Found 3 untapped strategic clusters."
              title="Autonomous Market Analysis"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 1, duration: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-4">
                <p className="text-base">
                  Your strategy for <strong>aiappbuilder.example</strong> is
                  ready for approval:
                </p>

                <button
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-all duration-300",
                    showDetail
                      ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                      : "border-border bg-background/50 hover:border-primary/50 hover:bg-background",
                  )}
                  onClick={() => setShowDetail(!showDetail)}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <p className="font-bold text-sm">
                        Strategy for the week - focus on longer tail keywords
                        targeting financial automations for smaller businesses
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
                        animate={{ height: "auto", opacity: 1 }}
                        className="overflow-hidden"
                        exit={{ height: 0, opacity: 0 }}
                        initial={{ height: 0, opacity: 0 }}
                      >
                        <div className="mt-4 space-y-4 border-border/50 border-t pt-4 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="flex items-center gap-1.5 font-bold text-primary text-xs uppercase tracking-widest">
                                <Target className="h-2.5 w-2.5" /> Target
                                Keywords
                              </p>
                              <div className="space-y-1 text-muted-foreground">
                                <p>
                                  • "transport management system automation"
                                </p>
                                <p>
                                  • "fleet management system automation for
                                  small businesses"
                                </p>
                                <p>• "custom logistics workflows for smb"</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="flex items-center gap-1.5 font-bold text-primary text-xs uppercase tracking-widest">
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
                            <p className="flex items-center gap-1.5 font-bold text-primary text-xs uppercase tracking-widest">
                              <Zap className="h-2.5 w-2.5" /> Why we win
                            </p>
                            <p className="text-muted-foreground italic leading-relaxed">
                              Writing a strong pillar article with related
                              longer-tail keywords will establish our site as an
                              authority in the area, and will capture informed
                              potential clients with high intent.
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-border/50 border-t pt-4">
                            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-muted-foreground text-xs uppercase tracking-tight">
                                Audit Schedule: 14 Days
                              </span>
                            </div>
                            <Button className="h-9 bg-emerald-600 px-4 text-sm text-white hover:bg-emerald-700">
                              <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                              Strategy
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {!showDetail && (
                  <p className="border-primary/20 border-l pl-2 text-muted-foreground text-sm italic">
                    Click the strategy to see keywords, stats, and expectations.
                  </p>
                )}
              </div>
            </motion.div>
          </ChatMockup>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            className="absolute -top-10 -left-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>
    </Section>
  );
}
