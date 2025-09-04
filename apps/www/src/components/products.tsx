import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";

export function Products() {
  return (
    <section className="section">
      <div className="container-narrow">
        <h2 className="font-semibold text-2xl tracking-tight md:text-3xl">
          Products you can use today
        </h2>
        <p className="mt-2 text-muted-foreground">
          Bootstrapped and customer-obsessed, built for production.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>
                Lightweight Result type for TypeScript
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Ergonomic, explicit success/failure handling without exceptions.
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <a href="/docs">Docs</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a
                    href="https://www.npmjs.com/package/@rectangular-labs/result"
                    rel="noreferrer"
                    target="_blank"
                  >
                    NPM
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emails</CardTitle>
              <CardDescription>Composable email kit + drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Ship beautiful, reliable emails with provider-agnostic drivers.
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <a href="/docs">Docs</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a
                    href="https://www.npmjs.com/package/@rectangular-labs/emails"
                    rel="noreferrer"
                    target="_blank"
                  >
                    NPM
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Starter Template</CardTitle>
              <CardDescription>
                Production-ready TypeScript monorepo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                TanStack Start app, ORPC API, Drizzle/Postgres, and shared UI.
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" variant="default">
                  <a
                    href="https://github.com/rectangular-labs/monorepo-template"
                    rel="noreferrer"
                    target="_blank"
                  >
                    View Repo
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default Products;
