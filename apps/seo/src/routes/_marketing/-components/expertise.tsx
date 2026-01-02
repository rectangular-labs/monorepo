import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { Check, User, Zap } from "@rectangular-labs/ui/components/icon";

const expertiseSteps = [
  { icon: Zap, label: "Set the strategy" },
  { icon: User, label: "Shape how ideas are structured" },
  { icon: Check, label: "Approve the final output" },
];

export function Expertise() {
  return (
    <Section className="border-border border-t bg-muted/30">
      <div className="mx-auto max-w-6xl gap-16 lg:grid lg:grid-cols-[1fr,1fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-bold text-primary text-xs uppercase tracking-[0.4em]">
              Section 1.5
            </p>
            <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
              Always moving in <br />
              <span className="font-semibold italic">your direction</span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fluid Posts is designed around one idea: your expertise is the
            value. You step in to define the intent, and everything else keeps
            moving automatically.
          </p>
          <ul className="space-y-4">
            {expertiseSteps.map((step) => (
              <li
                key={step.label}
                className="flex items-center gap-3 font-medium text-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" />
                </div>
                {step.label}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm italic">
            Everything else keeps moving automatically — always in service of
            the intent you’ve already set.
          </p>
        </div>

        <div className="relative flex items-center justify-center py-12">
          {/* Loop Graphic */}
          <div className="relative h-80 w-80">
            <svg
              className="h-full w-full overflow-visible"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient
                  id="loop-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0.2"
                  />
                  <stop offset="50%" stopColor="hsl(var(--primary))" />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0.2"
                  />
                </linearGradient>
              </defs>

              {/* The "Always Moving" Path */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#loop-gradient)"
                strokeWidth="0.5"
                strokeDasharray="1 3"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />

              {/* Step-in point (The User) */}
              <circle
                cx="50"
                cy="10"
                r="4"
                fill="hsl(var(--background))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              <text
                x="50"
                y="3"
                textAnchor="middle"
                className="fill-foreground font-bold text-[4px] uppercase tracking-tighter"
              >
                You (Expertise)
              </text>

              {/* Automation flow */}
              <motion.path
                d="M 50 10 A 40 40 0 1 1 49.9 10"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Automation
                </p>
                <p className="font-bold text-2xl text-foreground tracking-tighter">
                  In Motion
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
