import { Section } from "@rectangular-labs/ui/components/ui/section";

const cards = [
  {
    title: "GSC-aware Chat",
    body: "Connects directly to Google Search Console and DataForSEO so every plan is grounded in real demand.",
  },
  {
    title: "Article Writer",
    body: "Understands your voice, drafts pillar pieces, and tags each paragraph with the briefs you approve.",
  },
  {
    title: "Direct Publisher",
    body: "Publishes to your CMS, tracks rankings, and reports performance alongside the same chat that planned it.",
  },
];

export function Data() {
  return (
    <Section className="border-border border-t bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.4em]">
            From data to pages
          </p>
          <h2 className="font-regular text-3xl text-foreground sm:text-4xl">
            End-to-end.
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Fluid Posts connects directly to Google Search Console and keyword
            data, understands your site’s voice, and writes articles aligned to
            real search demand.
          </p>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Planning, writing, and publishing live in one place.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-border/40 bg-muted/40 p-6 shadow-sm"
            >
              <h3 className="text-muted-foreground text-sm uppercase tracking-[0.4em]">
                {card.title}
              </h3>
              <p className="mt-3 text-muted-foreground text-sm">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
