import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { buttonVariants } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { ONBOARD_LINK } from "../constants";

export function Proof() {
  return (
    <Section className="border-border border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-border/40 bg-muted/40 p-8 text-left sm:p-12">
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Proven, even early
          </p>
          <h2 className="font-regular text-3xl text-foreground sm:text-4xl">
            One of our first clients reached first-page rankings in two
            competitive categories within two weeks of using Fluid Posts.
          </h2>
          <p className="text-lg text-muted-foreground">
            Not by chasing keywords, but by executing a clear strategy, fast.
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground text-sm">
              Dispute Ninja
            </p>
            <p className="text-muted-foreground text-xs uppercase tracking-[0.4em]">
              SERP snapshot
            </p>
            <p className="text-foreground">
              #1 • Data disputes{" "}
              <span className="text-muted-foreground">/ 2 weeks</span>
            </p>
          </div>
          <a
            className={buttonVariants({
              className: "gap-3",
              size: "sm",
            })}
            href={ONBOARD_LINK}
            rel="noopener"
            target="_blank"
          >
            Sign up today <MoveRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Section>
  );
}
