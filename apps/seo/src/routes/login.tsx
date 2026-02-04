import { AuthCard } from "@rectangular-labs/auth/components/auth/auth-card";
import { AuthProvider } from "@rectangular-labs/auth/components/auth/auth-provider";
import {
  AlertTriangleIcon,
  DiscordIcon,
  GitHubIcon,
  GoogleIcon,
} from "@rectangular-labs/ui/components/icon";
import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import {
  Button,
  buttonVariants,
} from "@rectangular-labs/ui/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { type } from "arktype";
import { getApiClientRq } from "~/lib/api";
import { authClient } from "~/lib/auth";
import { clientEnv } from "~/lib/env";

export const Route = createFileRoute("/login")({
  validateSearch: type({
    "next?": "string",
    "error?": "string",
  }),
  loaderDeps: ({ search }) => {
    return {
      next: search.next,
      error: search.error,
    };
  },
  loader: async ({ deps, context }) => {
    const session = await context.queryClient.fetchQuery(
      getApiClientRq().auth.session.current.queryOptions(),
    );

    if (session && !deps.error) {
      if (deps.next) {
        throw redirect({ to: deps.next });
      }
      throw redirect({
        from: "/login",
        to: "/$organizationSlug",
        params: {
          organizationSlug: "organization",
        },
      });
    }
    return { session };
  },
  component: Login,
});

function Login() {
  const { session } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const normalizedSuccessCallbackURL = search.next
    ? `${clientEnv().VITE_SEO_URL}${search.next}`
    : `${clientEnv().VITE_SEO_URL}/organization`;
  const newUserCallbackURL = search.next?.startsWith('/invite')
    ? normalizedSuccessCallbackURL
    : `${clientEnv().VITE_SEO_URL}/onboarding?next=${normalizedSuccessCallbackURL}`;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <ThemeToggle className="absolute top-4 right-4" />
      {!session && (
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
      )}
      {session && search.error && (
        <Alert className="mx-auto max-w-md" variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Account Linking Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {search.error === "account_already_linked_to_different_user"
                ? "This account is already linked to a different user. Please log out and try again."
                : "An error occurred while linking your account. Please try again."}
            </p>
            <div className="ml-auto flex items-center gap-2 text-foreground">
              <Button
                onClick={() => authClient.signOut()}
                size={"sm"}
                variant={"outline"}
              >
                Sign Out
              </Button>
              <Link className={buttonVariants({ size: "sm" })} to="/">
                Back to Dashboard
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
