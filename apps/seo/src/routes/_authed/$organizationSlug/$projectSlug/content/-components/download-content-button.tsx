"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { getApiClientRq } from "~/lib/api";
import {
  downloadContentZip,
  generateZipFilename,
} from "../-lib/download-content-zip";

type DownloadContentButtonProps = {
  organizationSlug: string;
  projectId: string;
  projectSlug: string;
  contentType: "scheduled" | "published";
  className?: string;
};

export function DownloadContentButton({
  organizationSlug,
  projectId,
  projectSlug,
  contentType,
  className,
}: DownloadContentButtonProps) {
  const downloadMutation = useMutation({
    mutationFn: async () => {
      // Fetch all content with markdown
      const api = getApiClientRq();
      const result =
        contentType === "scheduled"
          ? await api.content.exportScheduled.call({
              organizationIdentifier: organizationSlug,
              projectId,
            })
          : await api.content.exportPublished.call({
              organizationIdentifier: organizationSlug,
              projectId,
            });

      if (!result.data || result.data.length === 0) {
        throw new Error("No content available to download");
      }

      // Transform the data for the zip utility
      const contents = result.data.map((item) => ({
        slug: item.slug,
        title: item.title,
        description: item.description,
        primaryKeyword: item.primaryKeyword,
        articleType: item.articleType,
        heroImage: item.heroImage,
        heroImageCaption: item.heroImageCaption,
        contentMarkdown: item.contentMarkdown,
        publishedAt:
          "publishedAt" in item && item.publishedAt
            ? new Date(item.publishedAt)
            : null,
        scheduledFor:
          "scheduledFor" in item && item.scheduledFor
            ? new Date(item.scheduledFor)
            : null,
        createdAt: item.createdAt ? new Date(item.createdAt) : null,
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      }));

      const zipFilename = generateZipFilename(projectSlug, contentType);

      await downloadContentZip({
        contents,
        zipFilename,
      });

      return { count: contents.length };
    },
    onSuccess: ({ count }) => {
      toast.success(
        `Downloaded ${count} ${contentType} article${count === 1 ? "" : "s"}`,
      );
    },
    onError: (error) => {
      console.error("Download failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download content. Please try again.",
      );
    },
  });

  return (
    <Button
      aria-label={`Download all ${contentType} content as zip`}
      className={className}
      disabled={downloadMutation.isPending}
      onClick={() => downloadMutation.mutate()}
      size="icon-xs"
      title={`Download all ${contentType} content`}
      variant="ghost"
    >
      {downloadMutation.isPending ? (
        <Icons.Spinner className="size-4 animate-spin" />
      ) : (
        <Icons.Download className="size-4" />
      )}
    </Button>
  );
}
