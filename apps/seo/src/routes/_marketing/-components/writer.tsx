import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import {
  Check,
  Edit3,
  Globe,
  Search,
  ShieldCheck,
} from "@rectangular-labs/ui/components/icon";

const alignmentChecks = [
  { icon: Globe, label: "What’s already winning", status: "Aligned" },
  { icon: Search, label: "Top SERPs and AIO", status: "Optimized" },
  { icon: ShieldCheck, label: "Your standards", status: "Verified" },
];

export function Writer() {
  return (
    <Section className="border-border border-t bg-muted/20">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Section 4
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Your{" "}
            <span className="font-semibold text-primary">Limitless Writer</span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            You decide. It keeps going. Fluid Posts writes in your brand’s
            voice, ensuring every piece meets your highest standards and the
            market's demand.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <div className="rounded-3xl border border-border bg-background p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between border-border border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <div className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
                  Brand Voice Editor
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-4 w-3/4 rounded-full bg-muted/60" />
                <div className="h-4 w-full rounded-full bg-muted/60" />
                <div className="h-4 w-5/6 rounded-full bg-muted/60" />
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "90%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="relative h-4 overflow-hidden rounded-full bg-primary/20"
                >
                  <motion.div
                    className="absolute inset-0 bg-primary/40"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.div>
                <div className="h-4 w-2/3 rounded-full bg-muted/60" />
              </div>

              <div className="mt-8 flex justify-end">
                <div className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground text-xs">
                  <Edit3 className="h-3 w-3" /> Drafting...
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-2xl tracking-tight">
              Aligned with your standards, <br />
              <span className="font-normal italic">every time.</span>
            </h3>
            <div className="space-y-4">
              {alignmentChecks.map((check, index) => (
                <motion.div
                  key={check.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <check.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">{check.label}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
                    <Check className="h-3 w-3" /> {check.status}
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              Deliver without limits. Your expertise scaled to infinite output.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
