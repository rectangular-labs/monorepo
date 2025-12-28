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
import { type } from "arktype";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { type AuthViewPath, useAuth } from "../auth-provider";
import { PasswordInput } from "../password-input";
import type { VerificationInfo } from "./verification-form";

export function SignInForm({
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
  const {
    authClient,
    viewPaths,
    credentials,
    successHandler,
    successCallbackURL,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameEnabled = credentials?.useUsername;
  const rememberMeEnabled = credentials?.enableRememberMe;
  const schema = type({
    email: usernameEnabled
      ? type("string").atLeastLength(1).configure({
          message: "Username is required",
        })
      : type("string.email").configure({
          message: () => "Email is required",
        }),
    password: type("string > 0").configure({
      message: "Password is required",
    }),
    rememberMe: "boolean",
  });

  const form = useForm<typeof schema.infer>({
    resolver: arktypeResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: !rememberMeEnabled,
    },
  });

  async function signIn({ email, password, rememberMe }: typeof schema.infer) {
    setShouldDisable(true);
    setIsSubmitting(true);
    const response = await (async () => {
      if (usernameEnabled) {
        return await authClient.signIn.username({
          username: email,
          password,
          rememberMe,
        });
      } else {
        return await authClient.signIn.email({
          email,
          password,
          rememberMe,
        });
      }
    })();
    setIsSubmitting(false);
    setShouldDisable(false);

    if (response.error) {
      if (response.error.status === 403) {
        // Redirect to verify email address
        if (credentials?.verificationMode === "code") {
          void authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
          });
          setView(viewPaths.IDENTITY_VERIFICATION);
          setVerificationInfo({
            mode: "verification-email-code",
            identifier: email,
          });
        }
        if (credentials?.verificationMode === "token") {
          void authClient.sendVerificationEmail({
            email,
            callbackURL: successCallbackURL,
          });
          setView(viewPaths.IDENTITY_VERIFICATION);
          setVerificationInfo({
            mode: "verification-email-token",
            identifier: email,
          });
        }
        return;
      }

      form.setError("root", {
        message:
          response.error.message ??
          "Something went wrong. Please try again later.",
      });
      return;
    }

    if ("twoFactorRedirect" in response.data) {
      setView(viewPaths.TWO_FACTOR);
      return;
    }
    await successHandler();
  }

  if (!credentials) {
    console.warn(
      "Rendering the sign in form but credentials was set to `undefined` in the `AuthProvider`.",
    );
    return null;
  }

  return (
    <form className={"grid w-full gap-6"} onSubmit={form.handleSubmit(signIn)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="auth-sign-in-email">
                {usernameEnabled ? "Username" : "Email"}
              </FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete={
                  usernameEnabled ? "username webauthn" : "email webauthn"
                }
                disabled={isSubmitting || shouldDisable}
                id="auth-sign-in-email"
                placeholder={
                  usernameEnabled ? "Enter your username" : "Enter your email"
                }
                type={usernameEnabled ? "text" : "email"}
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
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="auth-sign-in-password">
                  Password
                </FieldLabel>
                {credentials?.enableForgotPassword && (
                  <Button
                    className="px-0"
                    onClick={() => setView(viewPaths.FORGOT_PASSWORD)}
                    type="button"
                    variant="link"
                  >
                    Forgot password?
                  </Button>
                )}
              </div>
              <PasswordInput
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="current-password webauthn"
                disabled={isSubmitting || shouldDisable}
                id="auth-sign-in-password"
                enableToggle
                placeholder="Your password"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {rememberMeEnabled && (
          <Controller
            control={form.control}
            name="rememberMe"
            render={({ field, fieldState }) => (
              <Field
                className="items-center"
                data-invalid={fieldState.invalid}
                orientation="horizontal"
              >
                <Checkbox
                  checked={field.value}
                  disabled={isSubmitting || shouldDisable}
                  id="auth-sign-in-rememberMe"
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="auth-sign-in-rememberMe">
                  Remember me
                </FieldLabel>
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

      <Button
        className={"w-full"}
        disabled={isSubmitting || shouldDisable}
        type="submit"
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
