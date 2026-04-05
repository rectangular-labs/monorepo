import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { seo } from "~/lib/seo";

const SIGNUP_MAILTO = "winston@fluidposts.com";

export const Route = createFileRoute("/sign-up-link")({
  head: () => ({
    meta: seo({
      title: "Sign-up link | Fluid Posts",
      description:
        "Request a sign-up link. Tell us about your company and what you want to rank for.",
      keywords: "Fluid Posts, sign up, SEO, contact",
    }),
  }),
  component: SignUpLinkPage,
});

function SignUpLinkPage() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <main className="bg-background">
      <Section className="py-12 md:py-16">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
          <div className="text-center">
            <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
              Sign-up link
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Share a few details and we will follow up with next steps.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
              <CardDescription>
                Submitting opens your email app with this information addressed
                to {SIGNUP_MAILTO}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {done ? (
                <p className="text-muted-foreground text-sm">
                  If your mail app did not open, check that you have an email
                  client configured, or email us directly at{" "}
                  <a
                    className="text-foreground underline underline-offset-4"
                    href={`mailto:${SIGNUP_MAILTO}`}
                  >
                    {SIGNUP_MAILTO}
                  </a>
                  .
                </p>
              ) : (
                <form
                  className="flex flex-col gap-4"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError(null);
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    const name = String(fd.get("name") ?? "").trim();
                    const email = String(fd.get("email") ?? "").trim();
                    const companyWebsite = String(
                      fd.get("companyWebsite") ?? "",
                    ).trim();
                    const searchTerms = String(
                      fd.get("searchTerms") ?? "",
                    ).trim();

                    if (!name) {
                      setError("Please enter your name.");
                      return;
                    }
                    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setError("Please enter a valid email address.");
                      return;
                    }
                    if (!companyWebsite) {
                      setError("Please enter your company website.");
                      return;
                    }

                    const body = [
                      `Name: ${name}`,
                      `Email: ${email}`,
                      `Company website: ${companyWebsite}`,
                      `Search terms to rank for: ${searchTerms || "(none specified)"}`,
                    ].join("\n");

                    const subject = encodeURIComponent("Sign-up link request");
                    window.location.href = `mailto:${SIGNUP_MAILTO}?subject=${subject}&body=${encodeURIComponent(body)}`;
                    setDone(true);
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="su-name">Name</Label>
                    <Input
                      autoComplete="name"
                      id="su-name"
                      name="name"
                      placeholder="Your name"
                      required
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="su-email">Email address</Label>
                    <Input
                      autoComplete="email"
                      id="su-email"
                      inputMode="email"
                      name="email"
                      placeholder="you@company.com"
                      required
                      type="email"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="su-site">Company website</Label>
                    <Input
                      autoComplete="url"
                      id="su-site"
                      name="companyWebsite"
                      placeholder="https://example.com"
                      required
                      type="url"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="su-terms">
                      Is there any search term in particular that you are
                      looking to rank for?
                    </Label>
                    <Textarea
                      className="min-h-[100px] resize-y"
                      id="su-terms"
                      name="searchTerms"
                      placeholder="e.g. “best CRM for small business”"
                    />
                  </div>
                  {error ? (
                    <p className="text-destructive text-sm" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit">Send request</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button asChild variant="ghost">
              <Link to="/">Back to contacts</Link>
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
