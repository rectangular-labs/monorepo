import { AlertIcon, Spinner } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { NavLink } from "../../-components/nav-link";
import { ProjectChatLayout } from "../-components/project-chat-layout";

export const Route = createFileRoute("/_authed/$organizationSlug/$projectSlug")(
  {
    loader: async ({ context, params }) => {
      const activeProject = await context.queryClient
        .ensureQueryData(
          getApiClientRq().project.get.queryOptions({
            input: {
              organizationIdentifier: params.organizationSlug,
              identifier: params.projectSlug,
            },
          }),
        )
        .catch((error) => {
          if (
            error instanceof Error &&
            error.message.includes("No project found")
          ) {
            return null;
          }
          throw error;
        });
      if (!activeProject) throw notFound();
    },
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const api = getApiClientRq();
  const queryClient = useQueryClient();

  const projectQuery = useQuery(
    api.project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );
  const project = projectQuery.data;
  const workflowId = project?.projectResearchWorkflowId ?? null;

  const statusQuery = useQuery(
    api.task.getStatus.queryOptions({
      input: { id: workflowId ?? "" },
      enabled: !!workflowId,
      refetchInterval: 8_000,
    }),
  );

  const isStatusLoading = statusQuery.isLoading;
  const status = statusQuery.data;
  const statusError = statusQuery.error;
  const isBlocked =
    !!workflowId &&
    (isStatusLoading ||
      statusError ||
      (status?.status && status.status !== "completed"));
  const isErrored =
    status?.status === "failed" ||
    status?.status === "cancelled" ||
    !!statusError;

  const { mutate: retry, isPending: isRetrying } = useMutation(
    api.task.create.mutationOptions({
      onSuccess: async (data) => {
        await api.project.update.call({
          id: data.projectId,
          organizationIdentifier: data.organizationId,
          projectResearchWorkflowId: data.taskId,
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: api.project.get.queryKey({
              input: {
                organizationIdentifier: organizationSlug,
                identifier: projectSlug,
              },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: api.task.getStatus.queryKey({
              input: { id: workflowId ?? "" },
            }),
          }),
        ]);
      },
    }),
  );

  if (isBlocked) {
    const statusMessage =
      statusError instanceof Error
        ? statusError.message
        : (status?.statusMessage ?? "We are setting things up...");

    return (
      <div>
        <ul className="flex items-center gap-4 overflow-x-auto border-b px-4 pb-2 text-muted-foreground">
          <NavLink
            activeOptions={{
              exact: true,
            }}
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug"
          >
            Overview
          </NavLink>
          <NavLink
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content"
          >
            Content
          </NavLink>

          <NavLink
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/settings"
          >
            Settings
          </NavLink>
        </ul>

        <div className="flex max-h-[calc(100vh-100px)] w-full justify-center overflow-y-auto">
          <Empty className="m-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {isErrored ? (
                  <AlertIcon className="text-destructive" />
                ) : (
                  <Spinner className="animate-spin" />
                )}
              </EmptyMedia>
              <EmptyTitle>
                {isErrored
                  ? "We hit a snag while setting up your project"
                  : "Setting up your project"}
              </EmptyTitle>
              <EmptyDescription>{statusMessage}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {isErrored && project && (
                <Button
                  disabled={isRetrying}
                  onClick={() =>
                    retry({
                      type: "seo-understand-site",
                      projectId: project.id,
                    })
                  }
                >
                  Retry setup
                </Button>
              )}
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ul className="flex items-center gap-4 overflow-x-auto border-b px-4 pb-2 text-muted-foreground">
        <NavLink
          activeOptions={{
            exact: true,
          }}
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug"
        >
          Overview
        </NavLink>
        <NavLink
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/content"
        >
          Content
        </NavLink>

        <NavLink
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/settings"
        >
          Settings
        </NavLink>
      </ul>

      <ProjectChatLayout>
        {/* 100px to account for the header */}
        <div className="flex max-h-[calc(100vh-100px)] w-full justify-center overflow-y-auto">
          <Outlet />
        </div>
      </ProjectChatLayout>
    </div>
  );
}
