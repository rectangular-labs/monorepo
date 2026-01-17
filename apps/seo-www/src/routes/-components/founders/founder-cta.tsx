import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { WaitListDialog } from "../waitlist-dialog";

export function FounderCTA() {
  return (
    <Section className="border-border border-t bg-background content-vis-auto">
      <div className="relative overflow-hidden rounded-3xl bg-background p-12 text-center md:p-20">
        <p className="mb-4 font-bold text-primary text-xs uppercase tracking-[0.4em]">
          Ready for your co-founder?
        </p>
        <h2 className="mb-6 font-semibold text-4xl tracking-tight md:text-6xl">
          Your End-to-End SEO <span className="text-primary">Co-Founder</span>{" "}
          is Ready for You
        </h2>

        <div className="mt-10 flex flex-col items-center gap-6">
          <WaitListDialog
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
              Launching in 2–3 weeks
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
