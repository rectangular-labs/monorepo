import { Section } from "@rectangular-labs/ui/components/ui/section";
import { createFileRoute } from "@tanstack/react-router";
import { FAQ } from "~/routes/-components/original/faq";

export const Route = createFileRoute("/who-we-are")({
  component: WhoWeArePage,
});

function WhoWeArePage() {
  return (
    <main className="bg-background">
      <Section className="border-border border-b bg-muted/20">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-16">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            About us
          </p>
          <h1 className="font-regular text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
            We&apos;re Winston and Aaron.
            <br />
            <span className="font-semibold text-primary">
              An engineer and a strategist.
            </span>
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
            We actually build and rank sites ourselves — and we&apos;re
            productizing the system that works.
          </p>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/50 p-6">
              <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                Winston
              </p>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Winston spent 5 years in Silicon Valley building automation
                systems for startups. Now he uses that same engineering
                precision to automate growth processes and get results fast.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/50 p-6">
              <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                Aaron
              </p>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Aaron, trained in law at Oxford, knows how to make words rank.
                He's taken multiple pages to the top of Google through
                structure, clarity, and intent-driven writing.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-primary/15 bg-primary/5 p-8">
            <p className="font-semibold text-foreground text-lg leading-relaxed">
              We know what we&apos;re doing in SEO — and we&apos;re productizing
              that knowledge so it&apos;s accessible to everyone, not just teams
              with time and budget.
            </p>
          </div>
        </div>
      </Section>

      <FAQ />
    </main>
  );
}
