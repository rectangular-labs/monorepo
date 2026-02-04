import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "~/lib/auth";

export const Route = createFileRoute("/_authed/invite/$invitationId")({
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { invitationId } = Route.useParams();
  const navigate = useNavigate();
  const session = useRouteContext({ from: "/_authed" });
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    setAcceptError(null);
    try {
      const response = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (response.error) {
        setAcceptError(response.error.message ?? "Failed to accept invitation");
        toast.error(response.error.message ?? "Failed to accept invitation");
        return;
      }
      toast.success("You have joined the organization!");
      // Navigate to the organization - we'll let the auto-routing handle the slug
      void navigate({
        to: "/$organizationSlug",
        params: { organizationSlug: "organization" },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept invitation";
      setAcceptError(message);
      toast.error(message);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization. Click below to accept.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Logged in as: {session.user.email}
          </p>
          {acceptError && (
            <p className="text-destructive text-sm">{acceptError}</p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Link className="flex-1" to="/">
            <Button className="w-full" variant="outline">
              Decline
            </Button>
          </Link>
          <Button
            className="flex-1"
            disabled={isAccepting}
            onClick={handleAcceptInvitation}
          >
            {isAccepting ? "Accepting..." : "Accept Invitation"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
