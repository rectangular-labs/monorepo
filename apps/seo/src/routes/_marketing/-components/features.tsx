import { Section } from "@rectangular-labs/ui/components/ui/section";

const features = [
  {
    title: "Strategy-aware chat",
    body: "Connected to Google Search Console and keyword data so the workflow understands real demand before it writes.",
  },
  {
    title: "Article planning & writing",
    body: "Aligns every brief with your intent, audience, and priority so the drafts feel like yours from the first pass.",
  },
  {
    title: "Direct publishing",
    body: "Publishes straight to your CMS with no manual handoffs and no missed approvals.",
  },
];

export function Features() {
  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Everything You Need, Nothing You Don’t
          </p>
          <h2 className="font-regular text-3xl text-foreground sm:text-4xl">
            One workflow. End to end.
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Fluid Posts keeps strategy, planning, writing, and publishing in a
            single flow so you never feel like you are ping-ponging between
            tools.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-border/40 bg-muted/40 p-6 transition hover:border-primary/70"
            >
              <h3 className="font-semibold text-foreground text-xl">
                {feature.title}
              </h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
