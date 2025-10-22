import { AuthCard } from "@rectangular-labs/auth/components/auth/auth-card";
import { AuthProvider } from "@rectangular-labs/auth/components/auth/auth-provider";
import {
  DiscordIcon,
  GitHubIcon,
  GoogleIcon,
} from "@rectangular-labs/ui/components/icon";
import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { type } from "arktype";
import { getApiClientRq } from "~/lib/api";
import { authClient } from "~/lib/auth";
import { clientEnv } from "~/lib/env";

export const Route = createFileRoute("/login")({
  validateSearch: type({
    "next?": "string",
  }),
  loaderDeps: ({ search }) => {
    return {
      next: search.next,
    };
  },
  loader: async ({ deps, context }) => {
    const session = await context.queryClient.fetchQuery(
      getApiClientRq().auth.session.current.queryOptions(),
    );

    if (session) {
      if (deps.next) {
        throw redirect({ to: deps.next });
      }
      throw redirect({
        to: "/$organizationSlug",
        params: {
          organizationSlug: "organization",
        },
      });
    }
    return;
  },
  component: Login,
});

function Login() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const normalizedSuccessCallbackURL = search.next
    ? `${clientEnv().VITE_SEO_URL}${search.next}`
    : `${clientEnv().VITE_SEO_URL}/organization`;
  const newUserCallbackURL = `${clientEnv().VITE_SEO_URL}/onboarding?next=${normalizedSuccessCallbackURL}`;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <ThemeToggle className="absolute top-4 right-4" />
      <AuthProvider
        authClient={authClient}
        credentials={{
          verificationMode:
            clientEnv().VITE_AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE,
          enableForgotPassword: true,
          enableConfirmPassword: true,
          enableRememberMe: true,
        }}
        redirects={{
          successCallbackURL: normalizedSuccessCallbackURL,
          onSuccess: () => {
            void queryClient
              .invalidateQueries({
                queryKey: getApiClientRq().auth.session.current.queryKey(),
                refetchType: "active",
              })
              .finally(() => {
                void navigate({ to: normalizedSuccessCallbackURL });
              });
          },
          newUserCallbackURL,
        }}
        socialProviders={[
          {
            provider: "google",
            name: "Google",
            icon: GoogleIcon,
            method: "social",
          },
          {
            provider: "github",
            name: "GitHub",
            icon: GitHubIcon,
            method: "social",
          },
          {
            provider: "discord",
            name: "Discord",
            icon: DiscordIcon,
            method: "social",
          },
        ]}
      >
        <AuthCard />
      </AuthProvider>
    </div>
  );
}
