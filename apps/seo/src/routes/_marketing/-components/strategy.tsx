import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  Search,
  Sparkles,
  Target,
  Zap,
} from "@rectangular-labs/ui/components/icon";

const opportunities = [
  {
    icon: Target,
    label: "Gaps worth filling",
    desc: "Uncovered 12 low-competition keywords in 'SaaS pricing'",
  },
  {
    icon: Sparkles,
    label: "Winners worth doubling down on",
    desc: "Top 3 pages trending up; recommend 5 internal links",
  },
  {
    icon: Zap,
    label: "Underperformers worth fixing",
    desc: "4 pages lost position; intent shift detected",
  },
];

export function Strategy() {
  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[5fr,7fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
              Section 3
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
              Always Ready for the <br />
              <span className="font-semibold text-primary">Next Win</span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Stay ahead — without resetting your thinking. Fluid Posts is always
            scanning forward, surfacing the opportunities that matter before you
            even sit down to review.
          </p>
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div
                key={opp.label}
                className="flex gap-4 rounded-2xl border border-border/50 bg-muted/30 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <opp.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    {opp.label}
                  </h3>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {opp.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="font-bold text-primary text-sm italic">
            The next win is already in motion.
          </p>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          {/* Radar Visual */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Concentric Circles */}
            <div className="absolute h-full w-full rounded-full border border-primary/10" />
            <div className="absolute h-3/4 w-3/4 rounded-full border border-primary/10" />
            <div className="absolute h-1/2 w-1/2 rounded-full border border-primary/10" />
            <div className="absolute h-1/4 w-1/4 rounded-full border border-primary/10" />

            {/* Sweeping Radar Arm */}
            <motion.div
              className="absolute h-1/2 w-[2px] origin-bottom bg-gradient-to-t from-primary to-transparent"
              style={{ bottom: "50%" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Target Points */}
            <TargetPoint delay={0.5} x="20%" y="30%" />
            <TargetPoint delay={1.5} x="70%" y="20%" />
            <TargetPoint delay={2.5} x="40%" y="80%" />
            <TargetPoint delay={3.5} x="80%" y="60%" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-full border border-border bg-background/80 p-6 shadow-2xl backdrop-blur-sm">
              <Search className="h-6 w-6 animate-pulse text-primary" />
              <div className="text-left">
                <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Scanning
                </p>
                <p className="font-bold text-foreground text-sm">
                  Opportunities Found
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function TargetPoint({ x, y, delay }: { x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="absolute h-2 w-2 rounded-full bg-primary"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.5, 0],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 2,
      }}
    />
  );
}
