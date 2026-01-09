import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  FileText,
  ArrowRight,
  ExternalLink,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";
import { useState } from "react";
import { cn } from "@rectangular-labs/ui/utils/cn";

export function Writer() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Section className="max-w-none border-border border-t bg-muted/20">
      <div className="mx-auto w-full space-y-12 px-4 md:px-12">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h2 className="font-regular text-4xl text-foreground leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
            Your Writing Team, <br />
            <span className="font-semibold text-primary">
              at Your Fingertips.
            </span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Approve, and it goes to work. Fluid Posts writes in your brand’s
            voice, grounded in fulfilling real search intent.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <ChatMockup className="shadow-2xl">
              <ChatMockupMessage from="user" delay={0.5}>
                Approve the roadmap. Let's start with the "AI Workflow for
                Enterprise" guide.
              </ChatMockupMessage>
              <ChatMockupTool
                state="input-streaming"
                title="Writing Content"
                input="Cluster: Enterprise SEO, Voice: Professional, Goal: Lead Gen"
                delay={1.5}
              />
              <ChatMockupMessage from="assistant" delay={2}>
                <div className="space-y-4">
                  <p className="text-sm">
                    The first draft is ready. I've focused on visibility across
                    traditional search and AI-driven discovery (GEO).
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all duration-300",
                      showPreview
                        ? "border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary/20"
                        : "border-border bg-background/50 hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <p className="font-bold text-[11px] italic">
                          "AI App Builder for Small Business: What It Is and How
                          to Choose"
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-bold text-[8px] text-primary uppercase tracking-widest">
                          Preview
                        </span>
                        <ArrowRight
                          className={cn(
                            "h-3 w-3 transition-transform",
                            showPreview && "rotate-90",
                          )}
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {showPreview && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 space-y-4 border-border/50 border-t pt-4">
                            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border/50 bg-background p-6 text-left shadow-inner">
                              <div className="prose prose-sm max-w-none text-[11px] text-muted-foreground leading-relaxed">
                                <p>
                                  In accounts payable, one small slip can turn
                                  into a very real cash leak. A duplicate
                                  invoice comes in, it looks “close enough,” and
                                  it gets paid. Then it happens again next week.
                                  Rather than striving for a perfect process
                                  immediately, implementing a system that
                                  catches expensive mistakes at the final stage
                                  is ideal, before money leaves your account.
                                </p>
                                <p>
                                  Industry estimates put duplicate payments at
                                  roughly{" "}
                                  <a
                                    href="https://www.stampli.com/blog/ap-automation/is-your-duplicate-invoice-detection-duplicitous/"
                                    className="text-primary underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    0.1% to 0.05%
                                  </a>{" "}
                                  of annual spend, which climbs fast as your
                                  vendor count and invoice volume grows. The
                                  good news: modern workflows and AI-driven
                                  finance solutions can shift you from “find
                                  errors in an audit later” to “block them in
                                  real time.”
                                </p>
                                <p>
                                  This guide walks you through a practical,
                                  step-by-step setup for duplicate invoice
                                  detection. You can implement the early steps
                                  in days, then level up with AI when you are
                                  ready.
                                </p>

                                <h2 className="mt-6 mb-2 font-bold text-foreground text-sm">
                                  What is Duplicate Invoice Detection and Why It
                                  Matters
                                </h2>
                                <p>
                                  Duplicate invoice detection is the process of
                                  spotting invoices that represent the same
                                  underlying charge, before you approve and pay
                                  them.
                                </p>
                                <p>There are two terms people mix up:</p>
                                <ul className="list-disc space-y-2 pl-4">
                                  <li>
                                    <strong>Duplicate invoice</strong>: Two
                                    documents that refer to one transaction.
                                    This can be accidental (vendor re-sends) or
                                    intentional (fraud). It can also be a “near
                                    duplicate” where fields differ slightly.
                                  </li>
                                  <li>
                                    <strong>Duplicate payment</strong>: The
                                    money actually leaves twice. This is the
                                    damage you are trying to prevent.
                                  </li>
                                </ul>
                                <p className="mt-4 opacity-50">...</p>
                              </div>

                              <div className="mt-6 flex items-center justify-between border-border border-t pt-4">
                                <p className="text-[9px] text-muted-foreground">
                                  Structure: Answer-First | SEO Optimized |
                                  Cluster Interlinked
                                </p>
                                <button
                                  type="button"
                                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-[10px] text-white transition-colors hover:bg-primary/90"
                                >
                                  View Full Article{" "}
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </ChatMockupMessage>
            </ChatMockup>
            <motion.div
              className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-8">
            <h3 className="font-regular text-2xl text-foreground leading-snug tracking-tight sm:text-3xl">
              Focused, clearly structured writing that{" "}
              <span className="font-semibold text-primary">
                scales without a ceiling.
              </span>
            </h3>
            <div className="space-y-4">
              {[
                "Search intent uncovered through analysis of top-ranking SERPs and AI overviews",
                "Focused, clearly structured writing that prioritises usefulness and readability",
                "SEO and GEO applied intentionally and effectively",
                "Built for visibility across traditional search and AI-driven discovery",
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3.5 w-3.5" />
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
