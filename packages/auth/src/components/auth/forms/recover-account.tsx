"use client";

import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  arktypeResolver,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@rectangular-labs/ui/components/ui/form";
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
    <Form {...form}>
      <form
        className="grid w-full gap-6"
        onSubmit={form.handleSubmit(recovery)}
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recovery Code</FormLabel>
              <FormControl>
                <Input
                  autoComplete="one-time-code"
                  placeholder="000000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className={"w-full"} disabled={isSubmitting} type="submit">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Recover Account
        </Button>
      </form>
    </Form>
  );
}
