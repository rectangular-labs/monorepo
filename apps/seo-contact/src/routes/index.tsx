import { ExternalLink, Logo } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { createFileRoute, Link } from "@tanstack/react-router";
import { clientEnv } from "~/lib/env";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const env = clientEnv();

  return (
    <main className="bg-background">
      <Section className="py-12 md:py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 text-center">
          <div className="flex flex-col gap-4">
            <div className="flex w-full items-center justify-center gap-4">
              <Logo className="h-14 w-14" />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  Fluid Posts
                </p>
              </div>
            </div>
            <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
              Connect directly with our team
            </h1>
            <p className="text-muted-foreground">
              Copy details, send an email, or jump to our main site.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="text-left">
              <CardHeader>
                <CardTitle>Aaron Leong</CardTitle>
                <CardDescription>Co-founder</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/aaron">View contact</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${env.VITE_AARON_EMAIL}`}>Email</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-left">
              <CardHeader>
                <CardTitle>Winston Yeo</CardTitle>
                <CardDescription>Co-founder</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/winston">View contact</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${env.VITE_WINSTON_EMAIL}`}>Email</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-center">
            <Button asChild variant="ghost">
              <a href={env.VITE_WWW_URL} rel="noreferrer" target="_blank">
                Visit main website
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
