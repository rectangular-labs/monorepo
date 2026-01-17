import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rectangular-labs/ui/components/ui/dialog";
import {
  arktypeResolver,
  Field,
  FieldError,
  FieldLabel,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";
import { useState } from "react";
import { serverEnv } from "~/lib/env";
import { ONBOARD_LINK } from "./constants";

const contactSchema = type({
  name: "string > 0",
  email: "string.email",
});

type ContactInput = typeof contactSchema.infer;

/**
 * Server function to create a contact in Apollo.io.
 * Uses the Apollo Contact API to add the email to the CRM.
 * @see https://docs.apollo.io/reference/create-a-contact
 */
const createApolloContact = createServerFn({ method: "POST" })
  .inputValidator((input: ContactInput) => {
    const result = contactSchema(input);
    if (result instanceof type.errors) {
      throw new Error("Invalid input");
    }
    return result;
  })
  .handler(async ({ data }: { data: ContactInput }) => {
    const env = serverEnv();
    const apiKey = env.APOLLO_CONTACT_API_KEY;

    // Split name into first and last name for Apollo
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
        // Enable deduplication to prevent duplicate contacts
        run_dedupe: true,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;
      const message =
        errorData?.error || errorData?.message || "Unable to submit";
      throw new Error(message);
    }

    return { ok: true };
  });

type Props = {
  trigger: React.ReactElement;
  className?: string;
};

export function WaitListDialog({ trigger, className }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    resolver: arktypeResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  async function onSubmit(data: ContactInput) {
    setSubmitError(null);
    try {
      await createApolloContact({ data });
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setSubmitError(e instanceof Error ? e.message : "Unable to submit");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn("w-[calc(100%-2rem)] max-w-sm sm:max-w-sm", className)}
      >
        <DialogHeader>
          <DialogTitle>Join the waitlist</DialogTitle>
          <DialogDescription>
            Get launch updates and early access. No spam.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel htmlFor="waitlist-name">Name</FieldLabel>
            <Input
              autoComplete="name"
              id="waitlist-name"
              placeholder="Jane Doe"
              type="text"
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>

          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="waitlist-email">Email</FieldLabel>
            <Input
              autoComplete="email"
              id="waitlist-email"
              inputMode="email"
              placeholder="you@company.com"
              type="email"
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>

          {status === "success" ? (
            <p className="font-medium text-emerald-600 text-sm">
              You're on the list!
            </p>
          ) : null}
          {status === "error" ? (
            <p className="font-medium text-destructive text-sm">
              {submitError}
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <Button asChild className="h-10" type="button" variant="outline">
              <a href={ONBOARD_LINK} rel="noopener" target="_blank">
                Book a call
              </a>
            </Button>
            <Button
              className="h-10 flex-1 gap-2"
              disabled={status === "success"}
              isLoading={form.formState.isSubmitting}
              type="submit"
            >
              Join waitlist <MoveRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
