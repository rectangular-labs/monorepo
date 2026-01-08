import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { Check, EyeOn, AlertIcon } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";

export function FounderIntervention() {
  const interventionItems = [
    {
      title: "Approving Strategic Direction",
      desc: "One click to greenlight a new cluster or a major pivot in thinking.",
      icon: Check,
    },
    {
      title: "Reviewing Outputs",
      desc: "Quickly scan the logic and brand voice before content goes live.",
      icon: EyeOn,
    },
    {
      title: "Correcting Misunderstandings",
      desc: "Catch and fix any drift in intent before it turns into wrong output.",
      icon: AlertIcon,
    },
  ];

  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Efficiency
          </p>
          <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Intervene only{" "}
            <span className="font-semibold text-primary">where it counts</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl leading-relaxed">
            Founders shouldn’t be micromanaging SEO. Fluid Posts handles
            auditing, planning, writing, and publishing — pulling you in only at
            critical moments.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[1fr,1.2fr] lg:items-center">
          <div className="space-y-8">
            <div className="grid gap-6">
              {interventionItems.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex items-start gap-5 rounded-2xl border border-border/50 bg-background/50 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-lg">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="border-primary/20 border-l-4 pl-6 font-medium text-lg text-muted-foreground italic">
              "You stay close to the vision without being trapped in the weeds."
            </p>
          </div>

          <div className="grid gap-4">
            {/* Box 1: Strategic Direction */}
            <div className="space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.02] p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                <Check className="h-3 w-3" /> Step 1: Strategic Greenlight
              </div>
              <p className="font-medium text-xs">
                "I recommend pivoting our 'How-To' guides into 'Enterprise
                Frameworks' to attract higher ACV leads."
              </p>
              <Button
                size="sm"
                className="h-9 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
              >
                <Check className="h-4 w-4" /> Approve Direction
              </Button>
            </div>

            {/* Box 2: Content Review */}
            <div className="space-y-4 rounded-3xl border border-blue-500/20 bg-blue-500/[0.02] p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 font-bold text-[10px] text-blue-600 uppercase tracking-widest">
                <EyeOn className="h-3 w-3" /> Step 2: Quality Scan
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-2">
                <span className="truncate font-bold text-[10px]">
                  Draft: "The ROI of Fluid SEO for CEOs"
                </span>
                <span className="shrink-0 rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 font-bold text-[9px] text-blue-600 uppercase tracking-tighter">
                  Scan Logic
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-2 border-blue-200 text-[10px] text-blue-700 hover:bg-blue-50"
                >
                  <EyeOn className="h-3 w-3" /> Quick Review
                </Button>
              </div>
            </div>

            {/* Box 3: Intent Drift Fix */}
            <div className="space-y-4 rounded-3xl border border-rose-500/20 bg-rose-500/[0.02] p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 font-bold text-[10px] text-rose-600 uppercase tracking-widest">
                <AlertIcon className="h-3 w-3" /> Step 3: Drift Correction
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                System detected a 15% drift in brand voice. Redirecting now.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-2 border-rose-200 text-[10px] text-rose-700 hover:bg-rose-50"
              >
                <AlertIcon className="h-3 w-3" /> Correct Intent Drift
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
