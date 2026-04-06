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
import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";
import { useState } from "react";
import { serverEnv } from "~/lib/env";
import { seo } from "~/lib/seo";

const signUpSchema = type({
  name: "string > 0",
  email: "string.email",
  companyWebsite: "string > 0",
  "searchTerms?": "string",
});

type SignUpInput = typeof signUpSchema.infer;

const submitSignUp = createServerFn({ method: "POST" })
  .inputValidator((input: SignUpInput) => {
    const result = signUpSchema(input);
    if (result instanceof type.errors) {
      throw new Error("Invalid input");
    }
    return result;
  })
  .handler(async ({ data }: { data: SignUpInput }) => {
    const env = serverEnv();
    const apiKey = env.APOLLO_CONTACT_API_KEY;

    const nameParts = data.name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || undefined;

    const response = await fetch("https://api.apollo.io/v1/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        email: data.email.trim(),
        first_name: firstName,
        last_name: lastName,
        run_dedupe: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => null);
      const message = errorData || "Unable to submit";
      throw new Error(message);
    }

    const telegramMessage = [
      "🎉 New sign-up link request!",
      "",
      `👤 Name: ${data.name}`,
      `📧 Email: ${data.email}`,
      `🌐 Company: ${data.companyWebsite}`,
      `🔍 Search terms: ${data.searchTerms || "(none specified)"}`,
    ].join("\n");

    try {
      await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: "HTML",
          }),
        },
      );
    } catch {
      // Don't fail the sign-up if Telegram notification fails
    }

    return { ok: true };
  });

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
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setStatus("submitting");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const companyWebsite = String(fd.get("companyWebsite") ?? "").trim();
    const searchTerms = String(fd.get("searchTerms") ?? "").trim();

    if (!name) {
      setErrorMessage("Please enter your name.");
      setStatus("idle");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("idle");
      return;
    }
    if (!companyWebsite) {
      setErrorMessage("Please enter your company website.");
      setStatus("idle");
      return;
    }

    try {
      await submitSignUp({
        data: {
          name,
          email,
          companyWebsite,
          searchTerms: searchTerms || undefined,
        },
      });
      setStatus("success");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

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
                We will reach out to you shortly after you submit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === "success" ? (
                <div className="flex flex-col gap-4">
                  <p className="font-medium text-emerald-600 text-sm">
                    Thanks! We have received your request and will be in touch
                    soon.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/">Back to contacts</Link>
                  </Button>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-4"
                  noValidate
                  onSubmit={handleSubmit}
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
                      placeholder={'e.g. "best CRM for small business"'}
                    />
                  </div>
                  {errorMessage ? (
                    <p className="text-destructive text-sm" role="alert">
                      {errorMessage}
                    </p>
                  ) : null}
                  <Button disabled={status === "submitting"} type="submit">
                    {status === "submitting" ? "Submitting…" : "Submit"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {status !== "success" && (
            <div className="text-center">
              <Button asChild variant="ghost">
                <Link to="/">Back to contacts</Link>
              </Button>
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}
