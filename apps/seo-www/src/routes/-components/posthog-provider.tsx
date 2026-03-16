import { PostHogProvider } from "@posthog/react";
import { clientEnv } from "~/lib/env";

const options = {
  api_host: clientEnv().VITE_PUBLIC_POSTHOG_HOST,
  capture_exceptions: true,
  defaults: "2026-01-30",
} as const;

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider
      apiKey={clientEnv().VITE_PUBLIC_POSTHOG_KEY}
      options={options}
    >
      {children}
    </PostHogProvider>
  );
}
