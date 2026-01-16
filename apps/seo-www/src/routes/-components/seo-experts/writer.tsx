import {
  ArrowRight,
  Check,
  ExternalLink,
  FileText,
  Search,
  Sparkles,
  Target,
} from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChatMockup, ChatMockupMessage } from "./chat-mockup";

export function Writer() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
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

        <div className="grid gap-16 lg:grid-cols-2 lg:items-stretch">
          <div className="relative h-full">
            <ChatMockup
              className={cn(
                "h-full shadow-2xl transition-[min-height] duration-300",
                showPreview ? "min-h-[520px]" : "min-h-[280px]",
              )}
            >
              <ChatMockupMessage delay={0.5} from="assistant">
                <div className="space-y-4">
                  <p className="text-base">
                    The first draft is ready. I've focused on visibility across
                    traditional search and AI-driven discovery (GEO).
                  </p>

                  <button
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all duration-300",
                      showPreview
                        ? "border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary/20"
                        : "border-border bg-background/50 hover:border-primary/50",
                    )}
                    onClick={() => setShowPreview(!showPreview)}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <p className="font-bold text-sm italic">
                          "AI App Builder for Small Business: What It Is and How
                          to Choose"
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-[10px] text-primary uppercase tracking-widest">
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
                          animate={{ height: "auto", opacity: 1 }}
                          className="overflow-hidden"
                          exit={{ height: 0, opacity: 0 }}
                          initial={{ height: 0, opacity: 0 }}
                        >
                          <div className="mt-4 space-y-4 border-border/50 border-t pt-4">
                            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border/50 bg-background p-6 text-left shadow-inner">
                              <div className="prose prose-base max-w-none text-muted-foreground text-sm leading-relaxed">
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
                                    className="text-primary underline"
                                    href="https://www.stampli.com/blog/ap-automation/is-your-duplicate-invoice-detection-duplicitous/"
                                    rel="noopener noreferrer"
                                    target="_blank"
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

                              <div className="mt-6 border-border border-t pt-4">
                                <button
                                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-[10px] text-white transition-colors hover:bg-primary/90"
                                  type="button"
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
              animate={{ scale: [1, 1.2, 1] }}
              className="absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Search,
                lead: "Search Intent Uncovered",
                rest: " through analysis of top-ranking SERPs and AI overviews",
              },
              {
                icon: Target,
                lead: "Focused, Clearly Structured Writing",
                rest: " that prioritises usefulness and readability",
              },
              {
                icon: Check,
                lead: "SEO and GEO Applied",
                rest: " intentionally and effectively",
              },
              {
                icon: Sparkles,
                lead: "Visibility Across Search",
                rest: " and AI-driven discovery",
              },
            ].map((item, index) => (
              <motion.div
                className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/50 p-3 shadow-sm backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                key={item.lead}
                transition={{ delay: index * 0.1 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-3 w-3" />
                </div>
                <span className="text-base leading-relaxed">
                  <span className="font-semibold">{item.lead}</span>
                  {item.rest}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
