import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  Sparkles,
  Target,
  Zap,
  Grid,
} from "@rectangular-labs/ui/components/icon";
import { ChatMockup, ChatMockupMessage, ChatMockupTool } from "./chat-mockup";

export function FounderStrategist() {
  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
              The 24/7 Strategist
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
              Never guess{" "}
              <span className="font-semibold text-primary">
                what to do next
              </span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fluid Posts is the strategist that never clocks out, analyzing live
            keyword data, GEO signals, and search behavior to decide what
            matters next — so strategy arrives justified and ready for approval.
          </p>
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Example Strategies Generated:</p>
            <div className="space-y-2">
              <div className="rounded-lg bg-background p-3 text-sm border border-border/50 shadow-sm">
                <p className="font-bold text-primary">GEO Intent Hijack</p>
                <p className="mt-1 text-xs text-muted-foreground">Intercepting 4 new "AI Answer" patterns for competitor products before they update.</p>
              </div>
              <div className="rounded-lg bg-background p-3 text-sm border border-border/50 shadow-sm">
                <p className="font-bold text-emerald-600">The "Authority Loop"</p>
                <p className="mt-1 text-xs text-muted-foreground">Connecting your 5 best-performing case studies into a programmatic internal-link cluster.</p>
              </div>
            </div>
          </div>
          <p className="font-bold text-primary text-sm italic">
            Strategy won’t pause, and neither will momentum.
          </p>
        </div>

        <div className="relative">
          <ChatMockup>
            <ChatMockupTool
              title="Autonomous Analysis"
              input="Scan: Competitive Landscape (GEO + SERP)"
              output="Found 3 new 'Win' vectors for Fluid Posts."
              delay={0.5}
            />
            <ChatMockupMessage role="assistant" delay={1}>
              <div className="space-y-4">
                <p className="font-medium">I've justified a new strategic direction:</p>
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-3 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Authority Win: "CEO Workflows"</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                        Data shows search intent shifting from "Tips" to "Frameworks". I recommend pausing the current blog series to build 3 High-Authority Frameworks.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-3 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Gap: Competitor 'X' Drift</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                        Competitor X has neglected their 'Security' cluster. We can overtake position #1 within 14 days by pivoting our current 'Compliance' guide.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs italic text-muted-foreground">Ready to execute against these shifts?</p>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
        </div>
      </div>
    </Section>
  );
}
