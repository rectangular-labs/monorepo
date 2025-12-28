"use client";

import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  arktypeResolver,
  Controller,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { type } from "arktype";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth-provider";

export function RecoverAccountForm() {
  const { authClient } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = type({ code: "string >= 1" });

  const form = useForm<{ code: string }>({
    resolver: arktypeResolver(schema),
    defaultValues: { code: "" },
  });

  async function recovery({ code }: { code: string }) {
    setIsSubmitting(true);
    const response = await authClient.twoFactor.verifyBackupCode({ code });
    setIsSubmitting(false);

    if (response?.error) {
      form.setError("code", {
        message: response.error.message ?? "Invalid code. Try again.",
      });
      form.resetField("code");
      return;
    }
  }

  return (
    <form className="grid w-full gap-6" onSubmit={form.handleSubmit(recovery)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="auth-recover-account-code">
                Recovery Code
              </FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="one-time-code"
                id="auth-recover-account-code"
                placeholder="000000"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className={"w-full"} disabled={isSubmitting} type="submit">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Recover Account
      </Button>
    </form>
  );
}
