import {
  ArrowUp,
  MoveUpRight,
  Terminal,
} from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export function Forecast() {
  return (
    <Section id="forecast">
      <div className="container mx-auto">
        <div className="flex flex-col items-start gap-4">
          <div>
            <Badge variant="outline">Forecasts</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
              Plan with ranges, not guesses
            </h2>
            <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
              Every campaign ships with time‑to‑rank and traffic‑lift ranges
              plus confidence bands. We recalibrate weekly as signals change—so
              plans stay realistic.
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md border p-6">
            <Terminal className="mb-4 h-5 w-5 text-primary" />
            <div className="text-3xl">2–6 weeks</div>
            <div className="text-muted-foreground text-sm">
              Time to first lift
            </div>
          </div>
          <div className="rounded-md border p-6">
            <ArrowUp className="mb-4 h-5 w-5 text-primary" />
            <div className="text-3xl">+5–15%</div>
            <div className="text-muted-foreground text-sm">
              Projected traffic lift
            </div>
          </div>
          <div className="rounded-md border p-6">
            <MoveUpRight className="mb-4 h-5 w-5 text-primary" />
            <div className="text-3xl">Weekly</div>
            <div className="text-muted-foreground text-sm">
              Forecast recalibration
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
