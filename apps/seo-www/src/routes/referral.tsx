import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export const Route = createFileRoute("/referral")({
  component: ReferralPage,
});

function ReferralPage() {
  return (
    <main className="bg-background">
      <Section className="border-border border-b bg-muted/20">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 text-center">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Referral program
          </p>
          <h1 className="font-regular text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
            Help anyone win their SEO Co-Founder. Get rewarded.
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
            Word of mouth matters a lot to us — and we’d love to show our
            appreciation to anyone who refers customers our way.
          </p>
        </div>
      </Section>

      <Section className="border-border border-b">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/50 bg-background/50 p-6">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
              1) Share
            </p>
            <p className="mt-2 font-semibold text-foreground text-xl">
              Send your referral link
            </p>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Share it with anyone you think would benefit.
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/50 p-6">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
              2) They onboard
            </p>
            <p className="mt-2 font-semibold text-foreground text-xl">
              Referee is onboarded
            </p>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              And enjoys their SEO Co-Founder — strategy, content, and reporting
              handled end-to-end.
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/50 p-6">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
              3) You get rewarded
            </p>
            <p className="mt-2 font-semibold text-foreground text-xl">
              Reward unlocked after month 2
            </p>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Once your referral completes their first 2 months with us, you’ll
              receive a reward worth the full value of their first two months.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-16">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="font-regular text-3xl text-foreground tracking-tight sm:text-4xl">
                Referral rewards
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Here’s how we’ll say thanks.
              </p>
            </div>

            <div className="rounded-3xl border border-primary/15 bg-primary/5 p-8">
              <p className="font-bold text-primary text-xs uppercase tracking-widest">
                Current program (beta)
              </p>
              <div className="mt-4 space-y-4 text-muted-foreground">
                <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
                  <p className="font-semibold text-foreground">
                    Reward = 2 months of their plan
                  </p>
                  <p className="mt-1 leading-relaxed">
                    After they complete their first 2 months with us, you’ll get
                    a reward worth the full price of those first two months.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
                  <p className="font-semibold text-foreground">
                    Super-referrer perks (coming soon)
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Refer more than 5 businesses and we’ll unlock additional
                    rewards and priority perks.
                  </p>
                </div>
                <p className="text-sm leading-relaxed">
                  Terms may evolve as we scale the program. We’ll always confirm
                  the current terms before onboarding your referral.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-muted/20 p-6">
            <p className="font-semibold text-foreground">How to refer</p>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Email{" "}
              <a className="underline" href="mailto:aaron@fluidposts.com">
                aaron@fluidposts.com
              </a>{" "}
              with the subject “Referral” and we’ll send you a referral link.
              (We’re keeping it lightweight while the program is in beta.)
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}
