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
      <div className="mx-auto max-w-6xl gap-16 lg:grid lg:grid-cols-[7fr,5fr] lg:items-center">
        <div className="relative order-2 lg:order-1">
          <ChatMockup>
            <ChatMockupTool
              title="Continuous Market Scan"
              output="Analysed live keyword data, GEO signals, and search behavior for 'Growth' intent."
              delay={0.5}
            />
            <ChatMockupMessage role="assistant" delay={1}>
              <div className="space-y-4">
                <p>
                  Strategy for next week is ready. I've surfaced 4 key wins:
                </p>
                <div className="grid gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2">
                    <Target className="h-3 w-3 text-emerald-600" />
                    <span>
                      <strong>Gap:</strong> Untapped GEO signals in "AI Ops"
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                    <span>
                      <strong>Win:</strong> Double down on "Lead Gen" cluster
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2">
                    <Zap className="h-3 w-3 text-rose-600" />
                    <span>
                      <strong>Fix:</strong> 3 underperforming case studies
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2">
                    <Grid className="h-3 w-3 text-primary" />
                    <span>
                      <strong>Authority:</strong> New "Founders" cluster
                    </span>
                  </div>
                </div>
              </div>
            </ChatMockupMessage>
          </ChatMockup>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
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
          <p className="font-bold text-primary text-sm italic">
            Strategy won’t pause, and neither will momentum.
          </p>
        </div>
      </div>
    </Section>
  );
}
