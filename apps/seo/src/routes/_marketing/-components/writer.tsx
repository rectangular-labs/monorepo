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
    <Section className="border-border border-t bg-muted/20">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Scale Without Drift
          </p>
          <h2 className="font-regular text-3xl text-foreground leading-[1.1] tracking-tight sm:text-4xl lg:text-6xl">
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
                            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border/50 bg-background p-4 text-left shadow-inner">
                              <div className="mb-4 space-y-1">
                                <p className="font-bold text-[10px] text-primary uppercase tracking-tighter">
                                  Target Intent: Commercial + Informational
                                </p>
                                <h4 className="font-bold text-sm">
                                  AI App Builder for Small Business: What It Is,
                                  What It Can Build, and How to Choose
                                </h4>
                              </div>

                              <p className="mb-3 text-[10px] text-muted-foreground italic leading-relaxed">
                                Small businesses don't fail because they lack
                                ideas — they stall because building software
                                used to require a big budget... An AI app
                                builder changes that by letting you describe
                                what you want in plain English.
                              </p>

                              <div className="mb-4 space-y-2">
                                <div className="rounded border border-muted-foreground/10 bg-muted/20 p-2 text-[9px]">
                                  <p className="mb-1 font-bold">
                                    H2: What small businesses build first
                                    (high-ROI examples)
                                  </p>
                                  <ul className="list-inside list-disc opacity-70">
                                    <li>
                                      Client onboarding + forms + approvals
                                    </li>
                                    <li>
                                      Lightweight CRM, quotes, and invoicing
                                    </li>
                                  </ul>
                                </div>
                              </div>

                              <div className="mb-4 space-y-2">
                                <p className="font-bold text-[10px]">
                                  FAQ block (Snippet Targeting)
                                </p>
                                <div className="space-y-2 rounded border border-emerald-500/10 bg-emerald-500/[0.02] p-2 text-[9px]">
                                  <p className="font-bold text-emerald-700">
                                    Q: Can an AI app builder connect to Stripe?
                                  </p>
                                  <p className="text-muted-foreground italic">
                                    A: Yes for common integrations—confirm
                                    exactly which systems you need and test a
                                    small workflow first.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 rounded border border-emerald-100 bg-emerald-50 p-2">
                                <Check className="h-2.5 w-2.5 text-emerald-600" />
                                <span className="font-medium text-[9px] text-emerald-700 italic">
                                  Conversion CTA Applied: "Describe your app in
                                  5 sentences → get a build plan"
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-[8px] text-muted-foreground">
                                Structure: Answer-First | FAQ Schema |
                                Interlinked Cluster
                              </p>
                              <button
                                type="button"
                                className="flex items-center gap-1 font-bold text-[8px] text-primary hover:underline"
                              >
                                Open in Dashboard{" "}
                                <ExternalLink className="h-2 w-2" />
                              </button>
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
