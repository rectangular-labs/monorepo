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

        <div className="space-y-20">
          {interventionItems.map((item, i) => (
            <div
              key={item.title}
              className="grid gap-12 md:grid-cols-[1fr,1.2fr] md:items-center"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="group flex items-start gap-5 rounded-2xl border border-border/50 bg-background/50 p-6 shadow-sm transition-colors hover:bg-muted/30"
                >
                  <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground text-xl">
                      {item.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="relative">
                {i === 0 && (
                  <div className="space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.02] p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                      <Check className="h-3 w-3" /> Step 1: Strategic Greenlight
                    </div>
                    <p className="font-medium text-xs leading-relaxed">
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
                )}

                {i === 1 && (
                  <div className="space-y-4 rounded-3xl border border-blue-500/20 bg-blue-500/[0.02] p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 font-bold text-[10px] text-blue-600 uppercase tracking-widest">
                      <EyeOn className="h-3 w-3" /> Step 2: Quality Scan
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-3">
                      <span className="truncate font-bold text-xs">
                        Draft: "The ROI of Fluid SEO for CEOs"
                      </span>
                      <span className="shrink-0 rounded border border-blue-100 bg-blue-50 px-2 py-0.5 font-bold text-[10px] text-blue-600 uppercase tracking-tighter">
                        Scan Logic
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-2 border-blue-200 text-blue-700 text-xs hover:bg-blue-50"
                      >
                        <EyeOn className="h-4 w-4" /> Quick Review
                      </Button>
                    </div>
                  </div>
                )}

                {i === 2 && (
                  <div className="space-y-4 rounded-3xl border border-rose-500/20 bg-rose-500/[0.02] p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 font-bold text-[10px] text-rose-600 uppercase tracking-widest">
                      <AlertIcon className="h-3 w-3" /> Step 3: Drift Correction
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      System detected a 15% drift in brand voice relative to
                      your "Founder Tone" settings. Redirecting outputs now.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-2 border-rose-200 text-rose-700 text-xs hover:bg-rose-50"
                    >
                      <AlertIcon className="h-4 w-4" /> Correct Intent Drift
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl pt-12 text-center">
          <p className="border-primary/20 border-l-4 pl-6 font-medium text-muted-foreground text-xl italic">
            "You stay close to the vision without being trapped in the weeds."
          </p>
        </div>
      </div>
    </Section>
  );
}
