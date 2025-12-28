"use client";

import { Spinner } from "@rectangular-labs/ui/components/icon";
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
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { type } from "arktype";
import { useState } from "react";
import { useAuth } from "../auth-provider";
import { PasswordInput } from "../password-input";
import { PasswordSchema } from "../schema/password";

type ChangePasswordProps = { onComplete?: () => void | Promise<void> } & (
  | {
      mode: "update";
    }
  | {
      mode: "reset-code";
      email: string;
      code: string;
    }
  | {
      mode: "reset-token";
      token: string;
    }
);

export function ChangePasswordForm(props: ChangePasswordProps) {
  const { authClient, credentials } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmPasswordEnabled = credentials?.enableConfirmPassword;
  const schema = type({
    oldPassword: props.mode === "update" ? PasswordSchema : type("undefined"),
    newPassword: PasswordSchema,
    confirmPassword: confirmPasswordEnabled
      ? PasswordSchema
      : type("undefined"),
  }).narrow((n, ctx) => {
    if (n.confirmPassword?.length && n.confirmPassword !== n.newPassword) {
      return ctx.reject({
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    return true;
  });

  const form = useForm({
    resolver: arktypeResolver(schema),
    defaultValues: {
      oldPassword: props.mode === "update" ? "" : undefined,
      newPassword: "",
      confirmPassword: confirmPasswordEnabled ? "" : undefined,
    },
  });

  async function handleSubmit(values: typeof schema.infer) {
    setIsSubmitting(true);
    const response = await (() => {
      if (props.mode === "update") {
        return authClient.changePassword({
          newPassword: values.newPassword,
          currentPassword: values.oldPassword ?? "",
          revokeOtherSessions: true,
        });
      }
      if (props.mode === "reset-token") {
        return authClient.resetPassword({
          newPassword: values.newPassword,
          token: props.token,
        });
      }
      if (props.mode === "reset-code") {
        return authClient.emailOtp.resetPassword({
          email: props.email,
          otp: props.code,
          password: values.newPassword,
        });
      }
      const _never: never = props;
      throw new Error("Invalid mode");
    })();
    setIsSubmitting(false);

    if (response.error) {
      form.setError("root", {
        message:
          response.error.message ??
          "Failed to change password. Please try again later.",
      });
      return;
    }
    await Promise.resolve(props.onComplete?.());

    toast.success("Password updated successfully");
    form.reset();
  }

  return (
    <form
      className={"grid w-full gap-6"}
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup>
        {props.mode === "update" && (
          <Controller
            control={form.control}
            name="oldPassword"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="auth-change-password-oldPassword">
                  Current password
                </FieldLabel>
                <PasswordInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  id="auth-change-password-oldPassword"
                  enableToggle
                  placeholder="Your current password"
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
          name="newPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="auth-change-password-newPassword">
                New password
              </FieldLabel>
              <PasswordInput
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                disabled={isSubmitting}
                id="auth-change-password-newPassword"
                enableToggle
                placeholder="At least 8 characters"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {confirmPasswordEnabled && (
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="auth-change-password-confirmPassword">
                  Confirm password
                </FieldLabel>
                <PasswordInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  id="auth-change-password-confirmPassword"
                  enableToggle
                  placeholder="Repeat new password"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}
      </FieldGroup>

      {form.formState.errors.root && (
        <FieldError errors={[form.formState.errors.root]} />
      )}

      <Button className={"w-full"} disabled={isSubmitting} type="submit">
        {isSubmitting && <Spinner className="animate-spin" />}
        {props.mode === "update" ? "Update password" : "Reset password"}
      </Button>
    </form>
  );
}
