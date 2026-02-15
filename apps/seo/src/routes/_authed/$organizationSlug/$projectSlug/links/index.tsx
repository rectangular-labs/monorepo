"use client";

import {
  EyeOn,
  Info,
  Link as LinkIcon,
  Shield,
} from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Checkbox } from "@rectangular-labs/ui/components/ui/checkbox";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@rectangular-labs/ui/components/ui/popover";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/links/",
)({
  beforeLoad: ({ context }) => {
    if (!context.user?.email?.endsWith("fluidposts.com")) {
      throw notFound();
    }
  },
  component: PageComponent,
});

type LinkStatus = "queued" | "placed" | "verified" | "lost";

function PageComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const api = getApiClientRq();

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery(
    api.project.getPublishingSettings.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const { mutate: updateProject, isPending } = useMutation(
    api.project.update.mutationOptions({
      onError: (mutationError) => {
        toast.error(mutationError.message);
      },
      onSuccess: async () => {
        toast.success("Link exchange settings updated");
        await queryClient.invalidateQueries({
          queryKey: api.project.getPublishingSettings.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
    }),
  );

  if (!project || isLoading || error) {
    return (
      <LoadingError
        error={error}
        errorDescription="There was an error loading link exchange settings. Please try again."
        errorTitle="Error loading link settings"
        isLoading={isLoading}
        onRetry={refetch}
      />
    );
  }

  const isParticipating =
    project.publishingSettings?.participateInLinkExchange ?? true;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="font-bold text-3xl tracking-tight">Links</h1>
        <p className="text-muted-foreground">
          Manage backlink exchange participation and monitor received links.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link exchange settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isParticipating}
              disabled={isPending}
              id="participate-in-link-exchange"
              onCheckedChange={(checked) => {
                const currentPublishingSettings =
                  project.publishingSettings ?? {
                    version: "v1" as const,
                    requireContentReview: true,
                    requireSuggestionReview: true,
                    participateInLinkExchange: true,
                  };
                const publishingSettings = {
                  ...currentPublishingSettings,
                  participateInLinkExchange: checked === true,
                };

                updateProject({
                  id: project.id,
                  organizationIdentifier: organizationSlug,
                  publishingSettings,
                });
              }}
            />
            <Label
              className="cursor-pointer"
              htmlFor="participate-in-link-exchange"
            >
              Participate in link exchange
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="How backlink exchange works"
                  className="mt-0.5 inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  type="button"
                >
                  <Info className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[calc(100vw-2rem)] max-w-[28rem] space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    How the Backlink Exchange Works
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Get high-quality, relevant backlinks on autopilot. The
                    network builds your backlink profile while you focus on
                    creating content.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="font-medium text-sm">
                    Requirements to participate
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-sm">
                    <li>Active Fluidposts subscription</li>
                    <li>
                      Connected website integration (WordPress, Webflow, etc.)
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-start gap-2">
                      <LinkIcon className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          Step 1: Earn monthly credits
                        </p>
                        <p className="text-muted-foreground">
                          Subscription credits are automatically allocated and
                          converted into backlinks placed on partner sites.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-start gap-2">
                      <LinkIcon className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          Step 2: ABC exchange (not reciprocal)
                        </p>
                        <p className="text-muted-foreground">
                          Site A links to Site B, Site B links to Site C, and
                          Site C links to Site A for a natural, non-reciprocal
                          pattern.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-start gap-2">
                      <Shield className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          Step 3: Smart matching and natural placement
                        </p>
                        <p className="text-muted-foreground">
                          Matching is based on niche relevance, and links are
                          naturally placed within article content.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-start gap-2">
                      <EyeOn className="mt-0.5 size-4 text-muted-foreground" />
                      <div className="space-y-2">
                        <p className="font-medium">
                          Step 4: Continuous monitoring
                        </p>
                        <p className="text-muted-foreground">
                          Backlinks are continuously monitored and updated with
                          lifecycle statuses:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status="queued" />
                          <StatusBadge status="placed" />
                          <StatusBadge status="verified" />
                          <StatusBadge status="lost" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links received</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
            Earned links will be displayed here shortly.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function StatusBadge({ status }: { status: LinkStatus }) {
  if (status === "queued") {
    return (
      <Badge
        className="border-zinc-300 bg-zinc-50 text-zinc-700"
        variant="outline"
      >
        Queued
      </Badge>
    );
  }

  if (status === "placed") {
    return (
      <Badge
        className="border-sky-300 bg-sky-50 text-sky-700"
        variant="outline"
      >
        Placed
      </Badge>
    );
  }

  if (status === "verified") {
    return (
      <Badge
        className="border-emerald-300 bg-emerald-50 text-emerald-700"
        variant="outline"
      >
        Verified
      </Badge>
    );
  }

  return (
    <Badge className="border-red-300 bg-red-50 text-red-700" variant="outline">
      Lost
    </Badge>
  );
}
