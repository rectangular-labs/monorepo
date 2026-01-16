import { Check, Users, Zap } from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export function FounderGrowth() {
  const points = [
    {
      icon: Users,
      title: "Organic Product Integration",
      desc: "Plugs your services and products organically within content to drive real leads.",
    },
    {
      icon: Zap,
      title: "Opportunistic",
      desc: "Finds adjacent wins and launches new clusters when it spots low-competition demand.",
    },
    {
      icon: Check,
      title: "Commercially Aware",
      desc: "Maps intent → offer → CTA so traffic becomes qualified leads.",
    },
  ];

  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Commercial ROI
          </p>
          <h2 className="font-regular text-3xl text-foreground leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Built to{" "}
            <span className="font-semibold text-primary">
              grow your business
            </span>
            ,
            <br />
            not just your website
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl leading-relaxed">
            Rankings don't matter unless they drive leads, conversions, and
            trust. Fluid Posts aligns every action to real commercial intent.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {points.map((item) => (
            <div
              className="rounded-2xl border border-border/50 bg-background/50 p-6 shadow-sm backdrop-blur transition-colors hover:border-primary/20"
              key={item.title}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground text-xl">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
