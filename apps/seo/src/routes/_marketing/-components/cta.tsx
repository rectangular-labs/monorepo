import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { ONBOARD_LINK } from "./constants";
import { MoveRight } from "@rectangular-labs/ui/components/icon";

export function CTA() {
  return (
    <Section className="max-w-none border-border border-t bg-primary/5 content-vis-auto">
      <div className="relative mx-auto w-full overflow-hidden rounded-3xl border bg-background p-12 px-4 text-center shadow-2xl md:p-20 md:px-12">
        <div className="absolute top-0 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

        <h2 className="mb-6 font-semibold text-4xl leading-[1.1] tracking-tight md:text-7xl">
          Put your expertise to work — <br />
          <span className="text-primary">without the ceiling.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-xl leading-relaxed">
          Limitless SEO work starts here.
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <Button asChild size="lg" className="h-14 gap-3 px-10 text-lg">
            <a href={ONBOARD_LINK} rel="noopener" target="_blank">
              Join the waitlist <MoveRight className="h-5 w-5" />
            </a>
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <p className="font-semibold text-muted-foreground text-sm">
              Launching in End-Jan 2026
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
