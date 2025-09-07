import { InteractiveGridPattern } from "@rectangular-labs/ui/components/background/interactive-grid-pattern";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-lg border p-8 text-center md:p-12">
        <h2 className="font-semibold text-3xl tracking-tight md:text-4xl">
          Build in the future
        </h2>
        <p className="mt-2 text-muted-foreground">
          We are actively building new products. Stay tuned.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/docs">Read the Docs</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/blog">Read Lab Notes</Link>
          </Button>
        </div>
        <InteractiveGridPattern
          className="-z-10"
          height={24}
          interactive
          squares={[60, 20]}
          width={24}
        />
      </div>
    </Section>
  );
}

export default CTA;
