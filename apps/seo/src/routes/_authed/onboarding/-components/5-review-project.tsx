import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { toSlug } from "@rectangular-labs/ui/utils/format/to-slug";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import {
  ManageProjectForm,
  type ManageProjectFormValues,
} from "../../-components/manage-project-form";
import { OnboardingSteps } from "../-lib/steps";
import { useMetadata } from "../-lib/use-metadata";

export function OnboardingReviewProject() {
  const matcher = OnboardingSteps.useStepper();
  const navigate = useNavigate();
  const { data: defaultValues } = useMetadata("understanding-site");

  const { mutateAsync: updateProject, isPending } = useMutation(
    getApiClientRq().project.update.mutationOptions({
      onSuccess: (data) => {
        void navigate({
          to: "/onboarding",
          search: (prev) => ({
            ...prev,
            projectId: data.id,
            organizationId: data.organizationId,
          }),
        });
        matcher.next();
      },
    }),
  );

  const handleSubmit = async (values: ManageProjectFormValues) => {
    if (!defaultValues?.projectId || !defaultValues?.organizationId) {
      return;
    }
    const slug = toSlug(values.name);
    await updateProject({
      id: defaultValues?.projectId,
      organizationIdentifier: defaultValues?.organizationId,
      websiteUrl: values.websiteUrl,
      name: values.name,
      slug,
      websiteInfo: {
        version: "v1",
        businessOverview: values.businessOverview,
        idealCustomer: values.idealCustomer,
        serviceRegion: values.serviceRegion,
        industry: values.industry,
        languageCode: values.languageCode,
        targetCountryCode: values.targetCountryCode,
        targetCity: values.targetCity,
        writingStyle: values.writingStyle,
        competitorsWebsites: values.competitorsWebsites,
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <Card className="rounded-none sm:rounded-lg">
        <CardHeader>
          <CardTitle>{matcher.current.title}</CardTitle>
          <CardDescription>{matcher.current.description}</CardDescription>
        </CardHeader>
        <ManageProjectForm
          className="max-h-[60vh] overflow-y-auto px-6"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        >
          <div className="flex w-full justify-between">
            <Button
              onClick={() => matcher.prev()}
              type="button"
              variant="ghost"
            >
              Back
            </Button>
            <Button className={"w-fit"} isLoading={isPending} type="submit">
              Continue
            </Button>
          </div>
        </ManageProjectForm>
      </Card>
    </div>
  );
}
