import { Button } from "@rectangular-labs/ui/components/ui/button";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./auth-provider";
import type { SocialProvider } from "./social-providers";

interface ProviderButtonProps {
  provider: SocialProvider;
  socialLayout: "auto" | "horizontal" | "grid" | "vertical";
  shouldDisable: boolean;
  setShouldDisable: (shouldDisable: boolean) => void;
}

export function ProviderButton({
  provider,
  socialLayout,
  shouldDisable,
  setShouldDisable,
}: ProviderButtonProps) {
  const {
    successCallbackURL,
    errorCallbackURL,
    newUserCallbackURL,
    authClient,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doSignInSocial = async () => {
    const callbackValues = {
      callbackURL: successCallbackURL,
      errorCallbackURL: errorCallbackURL,
      newUserCallbackURL: newUserCallbackURL,
    };

    setIsSubmitting(true);
    setShouldDisable(true);
    const response = await (() => {
      if (provider.method === "social") {
        return authClient.signIn.social({
          provider: provider.provider,
          disableRedirect: true,
          ...callbackValues,
        });
      } else {
        return authClient.signIn.oauth2({
          providerId: provider.provider,
          disableRedirect: true,
          ...callbackValues,
        });
      }
    })();
    if (response.data?.url) {
      window.location.href = response.data.url;
    }
    setShouldDisable(false);
    setIsSubmitting(false);

    if (response.error) {
      toast.error(response.error.message ?? "Failed to sign in");
      return;
    }
  };

  return (
    <Button
      className={cn(socialLayout === "vertical" ? "w-full" : "grow")}
      disabled={isSubmitting || shouldDisable}
      onClick={doSignInSocial}
      variant="outline"
    >
      {isSubmitting && <Loader2 className="animate-spin" />}
      {provider.icon && !isSubmitting && <provider.icon />}
      {socialLayout === "grid" && provider.name}
      {socialLayout === "vertical" && `Sign in with ${provider.name}`}
    </Button>
  );
}
