import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { ONBOARD_LINK } from "../constants";

export function CTA() {
  return (
    <Section className="content-vis-auto">
      <div className="relative overflow-hidden rounded-lg border bg-muted p-8 text-center md:p-12">
        <h2 className="font-semibold text-3xl tracking-tight md:text-4xl">
          Grow your site today
        </h2>
        <p className="mt-2 text-muted-foreground">
          Onboard in as little as 20 minutes. Start acting fast.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href={ONBOARD_LINK} rel="noopener" target="_blank">
              Start onboarding
            </a>
          </Button>
        </div>
      </div>
    </Section>
  );
}
