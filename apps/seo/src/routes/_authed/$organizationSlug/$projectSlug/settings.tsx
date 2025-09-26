import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { toSlug } from "@rectangular-labs/ui/utils/format/to-slug";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import {
  ManageProjectForm,
  type ManageProjectFormValues,
} from "~/routes/_authed/-components/manage-project-form";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings",
)({
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const {
    data: activeProject,
    isLoading: isLoadingActiveProject,
    error: activeProjectError,
  } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );
  const { mutateAsync: updateProject, isPending } = useMutation(
    getApiClientRq().project.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Project updated successfully!");
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.get.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
    }),
  );

  const handleSubmit = async (values: ManageProjectFormValues) => {
    if (!activeProject?.id || !activeProject?.organizationId) {
      return;
    }
    const slug = toSlug(values.name);

    await updateProject({
      id: activeProject.id,
      organizationIdentifier: activeProject.organizationId,
      websiteUrl: values.websiteUrl,
      name: values.name,
      slug,
      websiteInfo: {
        version: "v1",
        businessOverview: values.businessOverview,
        idealCustomer: values.idealCustomer,
        serviceRegion: values.serviceRegion,
        industry: values.industry,
      },
    });
  };

  return (
    <Section className="space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">
          Project Settings
        </h1>
        <p className="text-muted-foreground">
          Update your project settings below.
        </p>
      </div>
      <LoadingError
        error={activeProjectError}
        errorDescription="There was an error loading the project details. Please try again."
        errorTitle="Error loading project"
        isLoading={isLoadingActiveProject}
      />
      {activeProject && (
        <ManageProjectForm
          defaultValues={{
            name: activeProject.name || "",
            websiteUrl: activeProject.websiteUrl,
            businessOverview: activeProject.websiteInfo?.businessOverview || "",
            idealCustomer: activeProject.websiteInfo?.idealCustomer || "",
            serviceRegion: activeProject.websiteInfo?.serviceRegion || "",
            industry: activeProject.websiteInfo?.industry || "",
          }}
          onSubmit={handleSubmit}
        >
          <div className="flex w-full justify-end">
            <Button isLoading={isPending} type="submit">
              Save
            </Button>
          </div>
        </ManageProjectForm>
      )}
    </Section>
  );
}
