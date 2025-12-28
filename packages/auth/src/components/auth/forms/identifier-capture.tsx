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
import { PhoneInput } from "@rectangular-labs/ui/components/ui/phone-input";
import { type } from "arktype";
import { Loader2 } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import type { AuthViewPath } from "../auth-provider";
import { useAuth } from "../auth-provider";
import type { VerificationInfo } from "./verification-form";

type IdentifierCaptureMode =
  | "magic-link"
  | "email-code"
  | "forget-password-email"
  | "phone-code"
  | "forget-password-phone";

type IdentifierCaptureFormProps = {
  mode: IdentifierCaptureMode;
  submitText?: React.ReactNode | undefined;
  setView: (view: AuthViewPath) => void;
  setVerificationInfo: (info: VerificationInfo) => void;
  shouldDisable?: boolean;
  setShouldDisable: (disabled: boolean) => void;
  children?: React.ReactNode;
};

export function IdentifierCaptureForm({
  mode,
  submitText = "Continue",
  setView,
  setVerificationInfo,
  shouldDisable = false,
  setShouldDisable,
  children,
}: IdentifierCaptureFormProps) {
  if (
    mode === "magic-link" ||
    mode === "email-code" ||
    mode === "forget-password-email"
  ) {
    return (
      <EmailForm
        mode={mode}
        setShouldDisable={setShouldDisable}
        setVerificationInfo={setVerificationInfo}
        setView={setView}
        shouldDisable={shouldDisable}
        submitText={submitText}
      >
        {children}
      </EmailForm>
    );
  }
  return (
    <PhoneForm
      mode={mode}
      setShouldDisable={setShouldDisable}
      setVerificationInfo={setVerificationInfo}
      setView={setView}
      shouldDisable={shouldDisable}
      submitText={submitText}
    >
      {children}
    </PhoneForm>
  );
}

function EmailForm({
  mode,
  submitText,
  setView,
  setVerificationInfo,
  shouldDisable,
  setShouldDisable,
  children,
}: IdentifierCaptureFormProps) {
  const {
    authClient,
    viewPaths,
    credentials,
    successCallbackURL,
    errorCallbackURL,
    newUserCallbackURL,
    resetPasswordCallbackURL,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const schema = type({ email: "string.email >= 1" });
  const form = useForm({
    resolver: arktypeResolver(schema),
    defaultValues: { email: "" },
  });

  async function handleSubmit({ email }: typeof schema.infer) {
    if (mode === "phone-code" || mode === "forget-password-phone") {
      return;
    }
    if (mode === "forget-password-email" && !credentials) {
      console.warn(
        "Attempted to use forgot password when no credentials were passed.",
      );
    }
    const isCode = credentials?.verificationMode === "code";

    setShouldDisable(true);
    setIsSubmitting(true);
    const response = await (() => {
      switch (mode) {
        case "magic-link":
          return authClient.signIn.magicLink({
            email,
            callbackURL: successCallbackURL,
            newUserCallbackURL,
            errorCallbackURL,
          });
        case "email-code":
          return authClient.emailOtp.sendVerificationOtp({
            email,
            type: "sign-in",
          });
        case "forget-password-email": {
          return isCode
            ? authClient.emailOtp.sendVerificationOtp({
                email,
                type: "forget-password",
              })
            : authClient.requestPasswordReset({
                email,
                redirectTo: resetPasswordCallbackURL,
              });
        }
        default: {
          const _never: never = mode;
          throw new Error(`Invalid mode for email: ${_never}`);
        }
      }
    })();
    setIsSubmitting(false);
    setShouldDisable(false);

    if (response?.error) {
      if (response.error.status === 404) {
        const msg = () => {
          switch (mode) {
            case "magic-link":
              return "Route not found. Did you enable the `magicLink` plugin?";
            case "forget-password-email":
            case "email-code":
              return "Route not found. Did you enable the `emailOtp` plugin?";
            default:
              return "Route not found.";
          }
        };
        form.setError("root", { message: msg() });
        return;
      }
      form.setError("root", {
        message:
          response.error.message ??
          "Something went wrong. Please try again later.",
      });
      return;
    }

    // success routing
    setView(viewPaths.IDENTITY_VERIFICATION);
    const verificationMode = (() => {
      switch (mode) {
        case "magic-link":
          return "magic-link-token";
        case "email-code":
          return "email-code";
        case "forget-password-email":
          return isCode ? "password-reset-email-code" : "password-reset-token";
      }
    })();
    setVerificationInfo({
      mode: verificationMode,
      identifier: email,
    });
  }

  return (
    <form
      className={"grid w-full gap-6"}
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="auth-identifier-capture-email">
                Email
              </FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="email webauthn"
                id="auth-identifier-capture-email"
                placeholder="you@example.com"
                type="email"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {form.formState.errors.root && (
        <FieldError errors={[form.formState.errors.root]} />
      )}
      {children ?? (
        <Button
          className={"w-full"}
          disabled={isSubmitting || shouldDisable}
          type="submit"
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          {submitText}
        </Button>
      )}
    </form>
  );
}

function PhoneForm({
  mode,
  children,
  submitText,
  shouldDisable,
  setView,
  setVerificationInfo,
  setShouldDisable,
}: IdentifierCaptureFormProps) {
  const { authClient, viewPaths, credentials } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const schema = type({ phone: "string >= 6" });
  const form = useForm({
    resolver: arktypeResolver(schema),
    defaultValues: { phone: "" },
  });

  async function handleSubmit({ phone }: typeof schema.infer) {
    if (
      mode === "magic-link" ||
      mode === "email-code" ||
      mode === "forget-password-email"
    ) {
      return;
    }
    if (mode === "forget-password-phone" && !credentials) {
      console.warn(
        "Attempted to use forgot password when no credentials were passed.",
      );
    }
    const isCode = credentials?.verificationMode === "code";
    if (!isCode && mode === "forget-password-phone") {
      console.warn(
        "Attempting to use token verification for phone number. This is likely a mistake. Please set verificationMode to 'code' in the AuthProvider.",
      );
      return;
    }

    setShouldDisable(true);
    setIsSubmitting(true);
    const response = await (() => {
      switch (mode) {
        case "phone-code":
          return authClient.phoneNumber.sendOtp({
            phoneNumber: phone,
          });
        case "forget-password-phone": {
          return authClient.phoneNumber.requestPasswordReset({
            phoneNumber: phone,
          });
        }
        default: {
          const _never: never = mode;
          throw new Error(`Invalid mode for phone: ${_never}`);
        }
      }
    })();
    setIsSubmitting(false);
    setShouldDisable(false);
    if (response?.error) {
      if (response.error.status === 404) {
        form.setError("root", {
          message: "Route not found. Did you enable the `phoneNumber` plugin?",
        });
        return;
      }
      form.setError("root", {
        message:
          response.error.message ??
          "Something went wrong. Please try again later.",
      });
      return;
    }

    // success routing
    setView(viewPaths.IDENTITY_VERIFICATION);
    const verificationMode = (() => {
      switch (mode) {
        case "phone-code":
          return "phone-code";
        case "forget-password-phone":
          return "password-reset-phone-code";
      }
    })();
    setVerificationInfo({
      mode: verificationMode,
      identifier: phone,
    });
  }

  return (
    <form
      className={"grid w-full gap-6"}
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="auth-identifier-capture-phone">
                Phone number
              </FieldLabel>
              <PhoneInput
                {...field}
                aria-invalid={fieldState.invalid}
                defaultCountry="US"
                id="auth-identifier-capture-phone"
                placeholder="(555) 123-4567"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {form.formState.errors.root && (
        <FieldError errors={[form.formState.errors.root]} />
      )}
      {children ?? (
        <Button
          className={"w-full"}
          disabled={isSubmitting || shouldDisable}
          type="submit"
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          {submitText}
        </Button>
      )}
    </form>
  );
}
