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
import { InputOTP } from "@rectangular-labs/ui/components/ui/input-otp";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { type } from "arktype";
import { Loader2, SendIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AuthViewPath, useAuth } from "../auth-provider";
import { OTPInputGroup } from "../otp-input-group";

export function TwoFactorForm({
  setView,
}: {
  setView: (view: AuthViewPath) => void;
}) {
  const { authClient, successHandler, viewPaths } = useAuth();
  const [isSubmitting, _setIsSubmitting] = useState(false);
  const { data: session, isPending: isLoadingSession } =
    authClient.useSession();

  const initialSendRef = useRef(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [coolDownSeconds, setCoolDownSeconds] = useState(0);
  const [method, _setMethod] = useState<"totp" | "otp" | null>(null);

  const schema = type({
    code: "string.numeric",
    trustDevice: "boolean?",
  }).narrow(({ code }, ctx) => {
    if (code.length !== 6) {
      return ctx.reject({ expected: "a valid code", actual: "" });
    }
    return true;
  });

  const form = useForm({
    resolver: arktypeResolver(schema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (coolDownSeconds <= 0) return;
    const timer = setTimeout(
      () => setCoolDownSeconds((prev) => prev - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [coolDownSeconds]);

  const sendOtp = useCallback(async () => {
    if (isSendingOtp) {
      return;
    }
    if (coolDownSeconds > 0) {
      toast.info(
        `Please wait ${coolDownSeconds} seconds before requesting for the code again`,
      );
      return;
    }

    setIsSendingOtp(true);
    const response = await authClient.twoFactor.sendOtp();
    setIsSendingOtp(false);

    if (response.error) {
      form.setError("code", {
        message: response.error.message ?? "Failed to send code",
      });
      return;
    }
    setCoolDownSeconds(60);
    initialSendRef.current = false;
  }, [authClient, form, isSendingOtp, coolDownSeconds]);

  useEffect(() => {
    if (method === "otp" && coolDownSeconds <= 0 && !initialSendRef.current) {
      initialSendRef.current = true;
      void sendOtp();
    }
  }, [coolDownSeconds, method, sendOtp]);

  async function verifyCode({
    code,
    trustDevice,
  }: {
    code: string;
    trustDevice?: boolean;
  }) {
    if (isLoadingSession) {
      return;
    }

    const twoFactorEnabled = session?.user.twoFactorEnabled;
    if (twoFactorEnabled) {
      toast.error("User already has two-factor enabled. ");
      return;
    }

    const verifyMethod =
      method === "otp"
        ? authClient.twoFactor.verifyOtp
        : authClient.twoFactor.verifyTotp;

    const response = await verifyMethod({
      code,
      trustDevice,
    });

    if (response.error) {
      form.setError("code", {
        message: response.error.message ?? "Invalid code. Try again.",
      });
      form.resetField("code");
      return;
    }

    toast.success("Two-factor authentication enabled successfully");
    await successHandler();
  }

  return (
    <form
      className={"grid w-full gap-6"}
      onSubmit={form.handleSubmit(verifyCode)}
    >
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor="auth-two-factor-code">
          One-time password
        </FieldLabel>
        <Button
          className="px-0"
          onClick={() => setView(viewPaths.RECOVER_ACCOUNT)}
          type="button"
          variant="link"
        >
          Forgot authenticator?
        </Button>
      </div>

      <FieldGroup>
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <InputOTP
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isSubmitting}
                id="auth-two-factor-code"
                maxLength={6}
                onChange={(value) => {
                  field.onChange(value);
                  if (value.length === 6) {
                    void form.handleSubmit(verifyCode)();
                  }
                }}
              >
                <OTPInputGroup otpSeparators={2} />
              </InputOTP>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="trustDevice"
          render={({ field, fieldState }) => (
            <Field
              className="items-center"
              data-invalid={fieldState.invalid}
              orientation="horizontal"
            >
              <Checkbox
                checked={field.value ?? false}
                disabled={isSubmitting}
                id="auth-two-factor-trustDevice"
                onCheckedChange={field.onChange}
              />
              <FieldLabel htmlFor="auth-two-factor-trustDevice">
                Trust this device
              </FieldLabel>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="grid gap-4">
        <Button isLoading={isSubmitting} type="submit">
          Verify
        </Button>

        <Button
          disabled={coolDownSeconds > 0 || isSendingOtp || isSubmitting}
          onClick={sendOtp}
          type="button"
          variant="outline"
        >
          {isSendingOtp ? <Loader2 className="animate-spin" /> : <SendIcon />}
          Resend code{coolDownSeconds > 0 && ` (${coolDownSeconds})`}
        </Button>
      </div>
    </form>
  );
}
