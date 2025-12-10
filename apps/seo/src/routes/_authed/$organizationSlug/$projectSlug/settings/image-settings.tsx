import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import type { ImageItem } from "./-components/image-setting-modal";
import { ImageUploadGrid } from "./-components/image-upload-grid";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings/image-settings",
)({
  component: ImageSettingsPage,
});

function ImageSettingsPage() {
  const { organizationSlug, projectSlug } = Route.useParams();

  const queryClient = useQueryClient();
  const {
    data: activeProject,
    isLoading,
    error,
  } = useQuery(
    getApiClientRq().project.getImageSettings.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const { mutateAsync: updateProject } = useMutation(
    getApiClientRq().project.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.getImageSettings.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
    }),
  );
  const [imageInstructions, setImageInstructions] = useState("");

  function handleSave(updateInput: {
    styleReferences?: ImageItem[];
    brandLogos?: ImageItem[];
    imageInstructions?: string;
  }) {
    if (!activeProject) return;

    if (
      !updateInput.styleReferences &&
      !updateInput.brandLogos &&
      !updateInput.imageInstructions?.trim()
    ) {
      return;
    }

    toast.promise(
      updateProject({
        id: activeProject.id,
        organizationIdentifier: organizationSlug,
        imageSettings: {
          version: "v1",
          styleReferences:
            updateInput.styleReferences ??
            activeProject.imageSettings?.styleReferences ??
            [],
          brandLogos:
            updateInput.brandLogos ??
            activeProject.imageSettings?.brandLogos ??
            [],
          imageInstructions:
            updateInput.imageInstructions ??
            activeProject.imageSettings?.imageInstructions ??
            "",
        },
      }),
      {
        loading: "Saving image settings...",
        success: "Image settings saved",
        error: (e) =>
          `Failed to save image settings. ${e instanceof Error ? e.message : "Unknown error"}`,
      },
    );
  }

  if (!activeProject || isLoading || error) {
    return (
      <LoadingError
        error={error}
        errorDescription="There was an error loading the project details. Please try again."
        errorTitle="Error loading project"
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">
          Image Settings
        </h1>
        <p className="text-muted-foreground">
          Configure reference images, brand assets, and global guidance for
          generated visuals.
        </p>
      </div>

      <ImageUploadGrid
        description="Upload visual style references to guide composition, lighting, and mood."
        items={activeProject.imageSettings?.styleReferences ?? []}
        kind="style-reference"
        onChange={(items) => handleSave({ styleReferences: items })}
        organizationId={activeProject.organizationId}
        projectId={activeProject.id}
        title="Style references"
      />

      <ImageUploadGrid
        description="Upload your brand logos so generated images can respect your visual identity."
        items={activeProject.imageSettings?.brandLogos ?? []}
        kind="brand-logo"
        onChange={(items) => handleSave({ brandLogos: items })}
        organizationId={activeProject.organizationId}
        projectId={activeProject.id}
        title="Brand logos"
      />

      <Card>
        <CardHeader>
          <CardTitle>Global image instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            onBlur={() => handleSave({ imageInstructions })}
            onChange={(event) => setImageInstructions(event.target.value)}
            placeholder="Any additional guidance for all generated images: aspect ratios, brand do/don'ts, accessibility notes, etc."
            rows={4}
            value={imageInstructions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
