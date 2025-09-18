import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Link } from "@tanstack/react-router";

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <Section className="flex min-h-screen items-center justify-center text-center">
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-muted-foreground text-xs tracking-widest">
          404
        </p>
        <h1 className="mt-2 font-bold text-3xl tracking-tight [text-wrap:balance] md:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-prose text-muted-foreground [text-wrap:balance]">
          {children ||
            "The page you are looking for does not exist or has been moved."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => window.history.back()}
            type="button"
            variant="outline"
          >
            Go back
          </Button>
          <Button asChild>
            <Link to="/">Go to home</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
