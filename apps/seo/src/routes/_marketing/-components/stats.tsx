import { ArrowRight, MoveUpRight } from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export const Stats = () => (
  <Section id="how-it-works">
    <div className="container mx-auto">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          <div>
            <Badge>How it works</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-left font-regular text-xl tracking-tighter md:text-5xl lg:max-w-xl">
              Onboard in minutes
              <span className="flex items-center gap-2">
                <ArrowRight /> Campaigns by intent
              </span>
              <span className="flex items-center gap-2">
                <ArrowRight /> Forecasts you can plan around
              </span>
              <span className="flex items-center gap-2">
                <ArrowRight /> Ship on schedule
              </span>
            </h2>
            <p className="text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-sm">
              Connect once. We crawl your IA, score opportunities by intent,
              propose briefs with keyword clusters, forecast time‑to‑rank and
              traffic‑lift ranges, and schedule it all on your calendar.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-2 lg:grid-cols-2">
            <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
              <MoveUpRight className="mb-10 h-4 w-4 text-primary" />
              <h2 className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
                2-6
                <span className="text-muted-foreground text-sm tracking-normal">
                  weeks
                </span>
              </h2>
              <p className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
                Typical time to first lift
              </p>
            </div>
            <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
              <MoveUpRight className="mb-10 h-4 w-4 text-primary" />
              <h2 className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
                24/7
                <span className="text-muted-foreground text-sm tracking-normal">
                  coverage
                </span>
              </h2>
              <p className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
                We watch so you don&apos;t have to
              </p>
            </div>
            <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
              <MoveUpRight className="mb-10 h-4 w-4 text-primary" />
              <h2 className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
                0
                <span className="text-muted-foreground text-sm tracking-normal">
                  spam
                </span>
              </h2>
              <p className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
                Helpful, brand-safe content only
              </p>
            </div>
            <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
              <MoveUpRight className="mb-10 h-4 w-4 text-primary" />
              <h2 className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
                5
                <span className="text-muted-foreground text-sm tracking-normal">
                  minutes
                </span>
              </h2>
              <p className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
                From keyword to ready-to-write brief
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Section>
);
