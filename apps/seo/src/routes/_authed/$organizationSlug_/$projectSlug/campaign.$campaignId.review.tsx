import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pending } from "~/components/pending";
import { getApiClientRq } from "~/lib/api";
import { CampaignReviewPanel } from "~/routes/_authed/$organizationSlug_/-components/campaign-review-panel";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/campaign/$campaignId/review",
)({
  loader: async ({ context, params }) => {
    const activeProject = await context.queryClient.ensureQueryData(
      getApiClientRq().project.get.queryOptions({
        input: {
          organizationIdentifier: params.organizationSlug,
          identifier: params.projectSlug,
        },
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    context.queryClient.ensureQueryData(
      getApiClientRq().campaigns.review.queryOptions({
        input: {
          id: params.campaignId,
          projectId: activeProject.id,
          organizationId: activeProject.organizationId,
        },
      }),
    );

    return null;
  },
  pendingComponent: () => <Pending />,
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug, campaignId } = Route.useParams();
  const { data: project } = useSuspenseQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const { data: reviewData } = useSuspenseQuery(
    getApiClientRq().campaigns.review.queryOptions({
      input: {
        id: campaignId,
        projectId: project.id,
        organizationId: project.organizationId,
      },
    }),
  );

  return <CampaignReviewPanel reviewData={reviewData} />;
}
