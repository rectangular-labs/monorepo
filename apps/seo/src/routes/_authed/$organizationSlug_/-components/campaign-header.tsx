"use client";

import { getInitials } from "@rectangular-labs/core/format/initials";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
import { InlineEdit } from "@rectangular-labs/ui/components/ui/inline-edit";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { getFaviconUrl } from "~/lib/url";
import { UserDropdown } from "~/routes/_authed/$organizationSlug/-components/user-dropdown";
import { NavLink } from "../../-components/nav-link";

type CampaignHeaderProps = {
  projectId: string;
  organizationId: string;
  campaignId: string;
  projectWebsiteUrl: string;
};

export function CampaignHeader({
  projectId,
  organizationId,
  campaignId,
  projectWebsiteUrl,
}: CampaignHeaderProps) {
  const queryClient = useQueryClient();
  const { organizationSlug, projectSlug } = useParams({
    from: "/_authed/$organizationSlug_/$projectSlug/campaign/$campaignId",
  });

  const { data: sessionData } = useQuery(
    getApiClientRq().auth.session.current.queryOptions(),
  );
  const { data, isLoading: isLoadingCampaign } = useQuery(
    getApiClientRq().campaigns.get.queryOptions({
      input: {
        id: campaignId,
        projectId,
        organizationId,
      },
    }),
  );

  const faviconUrl = getFaviconUrl(projectWebsiteUrl);
  const [title, setTitle] = useState(data?.campaign.title ?? "");

  useEffect(() => {
    setTitle(data?.campaign.title ?? "");
  }, [data?.campaign.title]);

  const { mutateAsync: updateTitle } = useMutation(
    getApiClientRq().campaigns.update.mutationOptions({
      onSuccess: async (updated) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getApiClientRq().campaigns.get.key(),
          }),
          queryClient.invalidateQueries({
            queryKey: getApiClientRq().campaigns.list.key({ type: "infinite" }),
          }),
        ]);
        setTitle(updated.title);
      },
    }),
  );

  const commitTitle = async () => {
    if (!title.trim() || !campaignId || !projectId || !organizationId) return;
    await updateTitle({
      id: campaignId,
      projectId,
      organizationId,
      title,
    });
  };

  return (
    <nav className="flex h-16 items-center justify-between rounded-t-md bg-background px-4">
      <div className="flex items-center gap-4">
        <Link to="..">
          <Avatar className="size-6">
            <AvatarImage src={faviconUrl ?? ""} />
            <AvatarFallback className="text-xs">
              {getInitials(title).toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col">
          {isLoadingCampaign && <Skeleton className="h-7 w-80" />}
          {!isLoadingCampaign && (
            <InlineEdit
              className="min-h-fit w-full min-w-0 truncate text-xl"
              inputType="text"
              maxLength={100}
              onChange={setTitle}
              onSave={commitTitle}
              required
              size="lg"
              value={title}
              variant="ghost"
            />
          )}
          <ul className="flex items-center gap-4 text-muted-foreground text-sm">
            <NavLink
              activeOptions={{
                exact: true,
              }}
              params={{ organizationSlug, projectSlug, campaignId }}
              to="/$organizationSlug/$projectSlug/campaign/$campaignId"
            >
              Edit
            </NavLink>
            <NavLink
              params={{ organizationSlug, projectSlug, campaignId }}
              to="/$organizationSlug/$projectSlug/campaign/$campaignId/review"
            >
              Review
            </NavLink>
          </ul>
        </div>
      </div>
      <UserDropdown user={sessionData?.user} />
    </nav>
  );
}
