"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
import { InlineEdit } from "@rectangular-labs/ui/components/ui/inline-edit";
import { getInitials } from "@rectangular-labs/ui/utils/format/initials";
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
  initialTitle: string;
};

export function CampaignHeader({
  projectId,
  organizationId,
  campaignId,
  projectWebsiteUrl,
  initialTitle,
}: CampaignHeaderProps) {
  const queryClient = useQueryClient();
  const { organizationSlug, projectSlug } = useParams({
    from: "/_authed/$organizationSlug_/$projectSlug/campaign/$campaignId",
  });
  const { data: sessionData } = useQuery(
    getApiClientRq().auth.session.current.queryOptions(),
  );
  const faviconUrl = getFaviconUrl(projectWebsiteUrl);
  const [title, setTitle] = useState(initialTitle);
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  const { mutateAsync: updateTitle } = useMutation(
    getApiClientRq().campaign.update.mutationOptions({
      onSuccess: async (updated) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getApiClientRq().campaign.get.key(),
          }),
          queryClient.invalidateQueries({
            queryKey: getApiClientRq().campaign.list.key({ type: "infinite" }),
          }),
        ]);
        setTitle(updated.title);
      },
    }),
  );

  const commitTitle = async () => {
    if (!title || !campaignId || !projectId || !organizationId) return;
    if (title === initialTitle) return;
    await updateTitle({
      id: campaignId,
      projectId,
      organizationId,
      title,
    });
  };

  return (
    <div className="flex h-16 items-center justify-between px-4">
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
          <InlineEdit
            className="min-h-fit text-xl"
            inputType="text"
            maxLength={100}
            onChange={setTitle}
            onSave={commitTitle}
            required
            size="lg"
            value={title}
            variant="ghost"
          />
          <ul className="flex items-center gap-4 text-muted-foreground text-sm">
            <NavLink
              params={{ organizationSlug, projectSlug, campaignId }}
              to="/$organizationSlug/$projectSlug/campaign/$campaignId"
            >
              Edit
            </NavLink>
            <NavLink
              activeOptions={{
                exact: true,
              }}
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/campaign"
            >
              Review & Publish
            </NavLink>
          </ul>
        </div>
      </div>
      <UserDropdown user={sessionData?.user} />
    </div>
  );
}
