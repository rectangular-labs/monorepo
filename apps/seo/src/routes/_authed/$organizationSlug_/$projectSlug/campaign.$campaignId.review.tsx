import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Pending } from "~/components/pending";
import { getApiClientRq } from "~/lib/api";
import { buildTree } from "~/lib/campaign/build-tree";
import { createPullDocumentQueryOptions } from "~/lib/campaign/sync";
import { LoadingError } from "../../-components/loading-error";
import { ReviewPanel } from "../-components/review/panel";

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

    return {
      projectId: activeProject.id,
      organizationId: activeProject.organizationId,
      campaignId: params.campaignId,
    };
  },
  pendingComponent: Pending,
  component: PageComponent,
});

function PageComponent() {
  const { projectId, organizationId, campaignId } = Route.useLoaderData();

  const {
    data: campaignLoroDoc,
    error: campaignLoroDocError,
    isLoading: isLoadingCampaignLoroDoc,
    refetch: refetchCampaignLoroDoc,
  } = useQuery(
    createPullDocumentQueryOptions({
      organizationId,
      projectId,
      campaignId,
    }),
  );
  const {
    data: mainLoroDoc,
    error: mainLoroDocError,
    isLoading: isLoadingMainLoroDoc,
    refetch: refetchMainLoroDoc,
  } = useQuery(
    createPullDocumentQueryOptions({
      organizationId,
      projectId,
      campaignId: null,
    }),
  );

  const treeResult = useMemo(() => {
    if (!campaignLoroDoc || !mainLoroDoc) {
      return;
    }
    const result = buildTree(campaignLoroDoc, mainLoroDoc);
    return result;
  }, [campaignLoroDoc, mainLoroDoc]);

  if (
    !campaignLoroDoc ||
    campaignLoroDocError ||
    isLoadingCampaignLoroDoc ||
    !mainLoroDoc ||
    mainLoroDocError ||
    isLoadingMainLoroDoc ||
    !treeResult
  ) {
    return (
      <LoadingError
        className="p-6"
        error={campaignLoroDocError || mainLoroDocError}
        errorTitle="Error loading files."
        isLoading={isLoadingCampaignLoroDoc || isLoadingMainLoroDoc}
        onRetry={async () => {
          await Promise.all([refetchCampaignLoroDoc(), refetchMainLoroDoc()]);
        }}
      />
    );
  }

  if (!treeResult.ok) {
    return (
      <LoadingError
        error={treeResult.error}
        errorTitle="Error figuring out what changed."
        isLoading={false}
      />
    );
  }

  const tree = treeResult.value;
  console.log("tree", tree);

  return (
    <ReviewPanel
      campaignId={campaignId}
      organizationId={organizationId}
      projectId={projectId}
      tree={tree}
    />
  );
}
