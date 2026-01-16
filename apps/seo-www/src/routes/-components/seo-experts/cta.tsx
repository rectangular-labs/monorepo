import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { WaitlistDialog } from "../waitlist-dialog";

export function CTA() {
  return (
    <Section className="border-border border-t bg-background content-vis-auto">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-background p-12 text-center md:p-20">
        <h2 className="mb-6 font-semibold text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          Put your expertise to work — <br />
          <span className="text-primary">without the ceiling.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-xl leading-relaxed">
          Limitless SEO starts here.
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <WaitlistDialog
            trigger={
              <Button
                className="h-14 gap-3 px-10 text-lg"
                size="lg"
                type="button"
              >
                Join the waitlist <MoveRight className="h-5 w-5" />
              </Button>
            }
          />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <p className="font-semibold text-muted-foreground text-sm">
              Launching in End-Jan 2026
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
