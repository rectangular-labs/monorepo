import { Button } from "@rectangular-labs/ui/components/ui/button";

export function CTA() {
  return (
    <section className="section">
      <div className="container-narrow">
        <div className="grid-border rounded-lg border p-8 text-center md:p-12">
          <h2 className="font-semibold text-3xl tracking-tight md:text-4xl">
            Start building with us
          </h2>
          <p className="mt-2 text-muted-foreground">
            Use what we ship. Tell us what to ship next.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="/login">Get Started</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/blog">Read Lab Notes</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
