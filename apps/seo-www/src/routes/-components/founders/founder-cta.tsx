import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { ONBOARD_LINK } from "../constants";

export function FounderCTA() {
  return (
    <Section className="border-border border-t bg-primary/5 content-vis-auto">
      <div className="relative overflow-hidden rounded-3xl border bg-background p-12 text-center shadow-2xl md:p-20">
        <div className="absolute top-0 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

        <p className="mb-4 font-bold text-primary text-xs uppercase tracking-[0.4em]">
          Ready for your co-founder?
        </p>
        <h2 className="mb-6 font-semibold text-4xl tracking-tight md:text-6xl">
          Strategy to Publishing. <br />
          <span className="text-primary">No ceiling. No smoke.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-xl leading-relaxed">
          Strategy, ideation, planning, reporting, writing, and publishing — all
          continuously aligned to your business goals.
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <Button asChild className="h-14 gap-3 px-10 text-lg" size="lg">
            <a href={ONBOARD_LINK} rel="noopener" target="_blank">
              Join the waitlist <MoveRight className="h-5 w-5" />
            </a>
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <p className="font-semibold text-muted-foreground text-sm">
              Launching in 2–3 weeks
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 p-8 opacity-10">
          <div className="select-none font-black text-9xl tracking-tighter">
            FLUID
          </div>
        </div>
      </div>
    </Section>
  );
}
