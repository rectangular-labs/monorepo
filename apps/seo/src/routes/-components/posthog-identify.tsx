import { usePostHog } from "@posthog/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getApiClientRq } from "~/lib/api";

/**
 * Identifies the current authenticated user in PostHog.
 * Should be rendered inside the _authed layout so the session is guaranteed.
 */
export function PosthogIdentify() {
  const posthog = usePostHog();
  const { data: session } = useQuery(
    getApiClientRq().auth.session.current.queryOptions(),
  );

  useEffect(() => {
    const user = session?.user;
    if (!user || !posthog) return;

    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
    });
  }, [session?.user, posthog]);

  return null;
}
