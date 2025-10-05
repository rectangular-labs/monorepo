import { GoogleIcon } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { useState } from "react";
import { authClient } from "~/lib/auth";
import { OnboardingSteps } from "../-lib/steps";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters";
function linkGoogleAccountForGsc(options?: { callbackURL?: string }) {
  const callbackURL =
    options?.callbackURL ??
    (typeof window !== "undefined" ? window.location.href : "/");

  return authClient.linkSocial({
    provider: "google",
    callbackURL,
    scopes: [GSC_SCOPE],
  });
}

export function OnboardingConnectGsc({
  description,
  title,
}: {
  title: string;
  description: string;
}) {
  const stepper = OnboardingSteps.useStepper();
  const [isLinking, setIsLinking] = useState(false);

  const handleConnect = async () => {
    try {
      setIsLinking(true);
      await linkGoogleAccountForGsc();
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleIcon className="size-4" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>Most accurate clicks and impressions from Google</li>
            <li>Up to date data on your website's performance</li>
            <li>Identify ranking pages to optimize</li>
          </ul>
        </CardContent>
        <CardFooter className="flex w-full justify-between gap-2">
          <Button onClick={() => stepper.prev()} variant="ghost">
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              disabled={isLinking}
              onClick={() => stepper.next()}
              variant="ghost"
            >
              Skip for now
            </Button>
            <Button isLoading={isLinking} onClick={handleConnect} size="lg">
              {!isLinking && <GoogleIcon className="size-4" />}
              Connect
            </Button>
          </div>
        </CardFooter>
      </Card>

      <p className="text-center text-muted-foreground text-xs">
        You can manage your Google Search Console account in settings at any
        time.
      </p>
    </div>
  );
}
