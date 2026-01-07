import { Section } from "@rectangular-labs/ui/components/ui/section";
import { motion } from "motion/react";
import { MoveUpRight, MoveDownLeft, TrendingUp, Info } from "@rectangular-labs/ui/components/icon";

const signalCards = [
  {
    title: "What's working",
    status: "positive",
    value: "+12.4%",
    desc: "Cluster: 'Marketing Automation'",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    title: "What isn't",
    status: "negative",
    value: "-3.1%",
    desc: "Cluster: 'Social Media Tips'",
    icon: MoveDownLeft,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
  {
    title: "Why",
    status: "neutral",
    value: "Insight",
    desc: "High volatility in AIO results for 'tips' intent.",
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
];

export function Reporting() {
  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="max-w-3xl space-y-4">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Section 2
          </p>
          <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
            Turn SEO reporting into your <br />
            <span className="font-semibold text-primary">
              unfair advantage.
            </span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            See what others miss. Fluid Posts briefs you at a glance — analysing
            performance of any cluster with real signals and data.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {signalCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-3xl border ${card.borderColor} ${card.bgColor} flex h-full flex-col justify-between p-8 shadow-sm transition-shadow hover:shadow-md`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold text-xs uppercase tracking-widest ${card.color}`}
                  >
                    {card.title}
                  </span>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-3xl text-foreground tracking-tighter">
                    {card.value}
                  </p>
                  <p className="font-medium text-foreground/70 text-sm">
                    {card.desc}
                  </p>
                </div>
              </div>
              <div className="mt-8 border-current/10 border-t pt-4 opacity-60">
                <div className="flex items-center gap-2 font-bold text-[10px] text-foreground uppercase tracking-tighter">
                  View full cluster signals <MoveUpRight className="h-3 w-3" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <p className="text-center font-medium text-muted-foreground text-sm italic">
          Clarity at your fingertips is unfair.
        </p>
      </div>
    </Section>
  );
}
