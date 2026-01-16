import { Section } from "@rectangular-labs/ui/components/ui/section";

const checkpoints = ["Approve outline?", "Adjust tone?", "Publish now?"];

export function Control() {
  return (
    <Section className="border-border border-t">
      <div className="mx-auto max-w-6xl gap-10 lg:grid lg:grid-cols-[5fr,4fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.4em]">
            You stay in control
          </p>
          <h2 className="font-regular text-3xl text-foreground sm:text-4xl">
            Built to execute exactly what you intend.
          </h2>
          <p className="text-lg text-muted-foreground">
            Approve direction, adjust tone, and publish without losing momentum.
            You decide what matters - we handle the heavy lifting.
          </p>
        </div>
        <div className="rounded-3xl border border-border/40 bg-muted/60 p-6 shadow-sm">
          <p className="font-semibold text-foreground text-sm">
            Live checkpoints
          </p>
          <ul className="mt-4 space-y-3">
            {checkpoints.map((item) => (
              <li
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-foreground/80 text-sm"
                key={item}
              >
                <span>{item}</span>
                <span className="text-primary">ready</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Instant iteration
          </p>
        </div>
      </div>
    </Section>
  );
}
