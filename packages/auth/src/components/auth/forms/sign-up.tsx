"use client";

import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Checkbox } from "@rectangular-labs/ui/components/ui/checkbox";
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
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { type } from "arktype";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { type AuthViewPath, useAuth } from "../auth-provider";
import { PasswordInput } from "../password-input";
import { PasswordSchema } from "../schema/password";
import type { VerificationInfo } from "./verification-form";

export function SignUpForm({
  setView,
  shouldDisable,
  setShouldDisable,
  setVerificationInfo,
}: {
  setView: (view: AuthViewPath) => void;
  shouldDisable: boolean;
  setShouldDisable: (disabled: boolean) => void;
  setVerificationInfo: (verificationInfo: VerificationInfo) => void;
}) {
  const { authClient, viewPaths, credentials, successHandler } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameEnabled = credentials?.useUsername;
  const confirmPasswordEnabled = credentials?.enableConfirmPassword;
  const additionalFields = credentials?.additionalFields ?? {};

  const baseSchema = type({
    email: type("string.email >= 1").configure({
      message: "Email is required",
    }),
    password: PasswordSchema,
    username: usernameEnabled ? "string >= 3" : "undefined",
    confirmPassword: confirmPasswordEnabled
      ? PasswordSchema
      : type("undefined"),
  });

  const additionalSchema: Record<string, string> = {};
  for (const key of Object.keys(additionalFields)) {
    const config = additionalFields[key];
    if (!config) continue;
    additionalSchema[key] = config.type;
    if (!config.required && !config.default) {
      additionalSchema[key] += "|undefined";
    }
    if (config.default) {
      additionalSchema[key] += ` = ${config.default}`;
    }
  }
  const defaultValues = useMemo<typeof baseSchema.infer>(() => {
    const values: typeof baseSchema.infer &
      Record<string, number | string | boolean | undefined> = {
      email: "",
      password: "",
      username: usernameEnabled ? "" : undefined,
      confirmPassword: confirmPasswordEnabled ? "" : undefined,
    };

    for (const key of Object.keys(additionalFields)) {
      values[key] = undefined;
    }
    return values;
  }, [usernameEnabled, confirmPasswordEnabled, additionalFields]);

  const form = useForm<typeof baseSchema.infer>({
    resolver: arktypeResolver(
      type({
        "...": baseSchema,
        ...additionalSchema,
      }).narrow((n, ctx) => {
        if (n.confirmPassword?.length && n.confirmPassword !== n.password) {
          return ctx.reject({
            message: "Passwords do not match",
            path: ["confirmPassword"],
          });
        }
        return true;
      }),
    ),
    defaultValues,
  });

  async function signUp(
    values: typeof baseSchema.infer &
      Record<string, number | string | boolean | undefined>,
  ) {
    for (const [key, cfg] of Object.entries(additionalFields)) {
      if (!cfg.validate) continue;
      const val = values[key];
      const ok = await Promise.resolve(cfg.validate(String(val ?? "")));
      if (!ok) {
        form.setError(key as keyof typeof baseSchema.infer, {
          message: `${cfg.label ?? key} is invalid`,
        });
        return;
      }
    }

    setShouldDisable(true);
    setIsSubmitting(true);
    const response = await authClient.signUp.email({
      ...values,
      email: values.email,
      password: values.password,
      name: (values.name as string) ?? "",
    });
    setIsSubmitting(false);
    setShouldDisable(false);

    if (response.error) {
      if (response.error.code === "PASSWORD_COMPROMISED") {
        form.setError("password", {
          message:
            response.error.message ??
            "Password has been compromised. Please choose a different one.",
        });
        form.resetField("password");
        if (confirmPasswordEnabled) form.resetField("confirmPassword");
        return;
      }

      form.setError("root", {
        message:
          response.error.message ?? "Failed to sign up. Please try again.",
      });
      return;
    }

    if (!response.data.token) {
      // Handle email verification case
      if (credentials?.verificationMode === "code") {
        setView(viewPaths.IDENTITY_VERIFICATION);
        setVerificationInfo({
          mode: "verification-email-code",
          identifier: values.email,
        });
      }
      if (credentials?.verificationMode === "token") {
        setView(viewPaths.IDENTITY_VERIFICATION);
        setVerificationInfo({
          mode: "verification-email-token",
          identifier: values.email,
        });
      }
      return;
    }

    toast.success("Account created successfully");
    await successHandler();
  }

  if (!credentials) {
    console.warn(
      "Rendering the sign up form but credentials was set to `undefined` in the `AuthProvider`.",
    );
    return null;
  }

  return (
    <form className={"grid w-full gap-6"} onSubmit={form.handleSubmit(signUp)}>
      <FieldGroup>
        {Object.keys(additionalFields).includes("name") && (
          <Controller
            control={form.control}
            name={"name" as keyof typeof baseSchema.infer}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="auth-sign-up-name">Name</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  disabled={isSubmitting || shouldDisable}
                  id="auth-sign-up-name"
                  placeholder="Your name"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        {usernameEnabled && (
          <Controller
            control={form.control}
            name="username"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="auth-sign-up-username">
                  Username
                </FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="username"
                  disabled={isSubmitting || shouldDisable}
                  id="auth-sign-up-username"
                  placeholder="Choose a username"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="auth-sign-up-email">Email</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="email"
                disabled={isSubmitting || shouldDisable}
                id="auth-sign-up-email"
                placeholder="you@example.com"
                type="email"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="auth-sign-up-password">Password</FieldLabel>
              <PasswordInput
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                disabled={isSubmitting || shouldDisable}
                enableToggle
                id="auth-sign-up-password"
                placeholder="Password"
                type="password"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {credentials?.enableConfirmPassword && (
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="auth-sign-up-confirmPassword">
                  Confirm password
                </FieldLabel>
                <PasswordInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  disabled={isSubmitting || shouldDisable}
                  enableToggle
                  id="auth-sign-up-confirmPassword"
                  placeholder="Confirm Password"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        {Object.keys(additionalFields)
          .filter((key) => key !== "name")
          .map((key) => {
            const cfg = additionalFields[key];
            if (!cfg) {
              // should never happen
              return null;
            }
            // TODO: fix the type casting
            const castKey = key as keyof typeof baseSchema.infer;

            if (cfg.type === "boolean") {
              return (
                <Controller
                  control={form.control}
                  key={castKey}
                  name={castKey}
                  render={({ field: formField, fieldState }) => (
                    <Field
                      className="items-center"
                      data-invalid={fieldState.invalid}
                      orientation="horizontal"
                    >
                      <Checkbox
                        checked={Boolean(formField.value)}
                        disabled={isSubmitting || shouldDisable}
                        id={`auth-sign-up-${String(castKey)}`}
                        onCheckedChange={formField.onChange}
                      />
                      <FieldLabel htmlFor={`auth-sign-up-${String(castKey)}`}>
                        {cfg.label ?? castKey}
                      </FieldLabel>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              );
            }

            return (
              <Controller
                control={form.control}
                key={castKey}
                name={castKey}
                render={({ field: formField, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`auth-sign-up-${String(castKey)}`}>
                      {cfg.label ?? castKey}
                    </FieldLabel>
                    {cfg.multiline ? (
                      <Textarea
                        {...formField}
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitting || shouldDisable}
                        id={`auth-sign-up-${String(castKey)}`}
                        placeholder={cfg.placeholder}
                      />
                    ) : (
                      <Input
                        {...formField}
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitting || shouldDisable}
                        id={`auth-sign-up-${String(castKey)}`}
                        placeholder={cfg.placeholder}
                        type={cfg.type === "number" ? "number" : "text"}
                      />
                    )}
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            );
          })}
      </FieldGroup>

      {form.formState.errors.root && (
        <FieldError errors={[form.formState.errors.root]} />
      )}

      <Button
        className={cn("w-full")}
        disabled={isSubmitting || shouldDisable}
        type="submit"
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        Sign Up
      </Button>
    </form>
  );
}
