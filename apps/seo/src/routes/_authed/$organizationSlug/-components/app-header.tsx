import { OrganizationSwitcher } from "@rectangular-labs/auth/components/organization/organization-switcher";
import type { Organization } from "@rectangular-labs/auth/server";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { BreadcrumbSeparator } from "@rectangular-labs/ui/components/ui/breadcrumb";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Kbd, KbdGroup } from "@rectangular-labs/ui/components/ui/kbd";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@rectangular-labs/ui/components/ui/tooltip";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { authClient } from "~/lib/auth";
import { useProjectChat } from "./project-chat-provider";
import { ProjectSwitcher } from "./project-switcher";
import { UserDropdown } from "./user-dropdown";

function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  const platform =
    // @ts-expect-error - userAgentData is not shipped a property in typescript
    navigator.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

export function AppHeader() {
  const navigate = useNavigate();
  const projectChat = useProjectChat();
  const [modKeyLabel, setModKeyLabel] = useState<"⌘" | "Ctrl">("Ctrl");
  const matcher = useMatchRoute();
  const projectParams = matcher({
    to: "/$organizationSlug/$projectSlug",
    fuzzy: true,
  });

  const { data: session } = useQuery(
    getApiClientRq().auth.session.current.queryOptions(),
  );
  const { data: activeOrganization, refetch: refetchActiveOrganization } =
    useQuery(getApiClientRq().auth.organization.active.queryOptions());

  const { data: organizations, isLoading: isLoadingOrganizations } = useQuery(
    getApiClientRq().auth.organization.list.queryOptions(),
  );
  const { data: projects, isLoading: isLoadingProjects } = useInfiniteQuery(
    getApiClientRq().project.list.infiniteOptions({
      enabled: !!activeOrganization?.slug,
      input: (pageParam) => {
        return {
          organizationIdentifier: activeOrganization?.slug ?? "",
          limit: 10,
          cursor: pageParam,
        };
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageCursor ?? undefined,
    }),
  );
  const { data: activeProject } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: activeOrganization?.slug ?? "",
        identifier: projectParams ? projectParams.projectSlug : "",
      },
      enabled: !!projectParams,
    }),
  );

  const { mutateAsync: createOrganization, isPending: isCreatingOrganization } =
    useMutation({
      mutationFn: async (newOrg: Partial<Organization>) => {
        const result = await authClient.organization.create({
          name: newOrg.name ?? "",
          slug: newOrg.slug ?? "",
          logo: newOrg.logo ?? "",
        });
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
      onSuccess: (data) => {
        toast.success("Organization created");
        void navigate({
          to: "/$organizationSlug",
          params: {
            organizationSlug: data?.slug,
          },
        });
      },
    });
  const onCreateOrganization = async (newOrg: Partial<Organization>) => {
    await createOrganization(newOrg);
  };

  useEffect(() => {
    setModKeyLabel(isApplePlatform() ? "⌘" : "Ctrl");
  }, []);

  return (
    <header
      className={`flex h-16 items-center gap-3 bg-background px-4 ${matcher({ to: "/$organizationSlug" }) ? "border-b" : ""}`}
    >
      <Link className="hidden font-semibold md:block" to="/">
        <Icons.Logo className="size-6" />
      </Link>
      <nav className="flex flex-1 items-center justify-between">
        <ol className="flex min-w-0 flex-1 items-center gap-3">
          <BreadcrumbSeparator className="hidden md:block" />
          {activeOrganization && organizations && (
            <li>
              <OrganizationSwitcher
                activeOrganizationId={activeOrganization.id}
                anchorComponent={Link}
                createHref={(orgSlug) => `/${orgSlug}`}
                isCreatingOrganization={isCreatingOrganization}
                isLoadingOrganizations={isLoadingOrganizations}
                onCreateOrganization={onCreateOrganization}
                onSelect={async (orgSlug) => {
                  void navigate({
                    to: "/$organizationSlug",
                    params: {
                      organizationSlug: orgSlug,
                    },
                  });
                  await refetchActiveOrganization();
                }}
                organizations={organizations}
                showCreateButton
              />
            </li>
          )}
          {projects && activeProject && (
            <>
              <BreadcrumbSeparator />
              <li>
                <ProjectSwitcher
                  activeProjectId={activeProject?.id}
                  anchorComponent={Link}
                  createHref={(projectSlug) =>
                    `/${activeOrganization?.slug}/${projectSlug}`
                  }
                  isLoadingProjects={isLoadingProjects}
                  onCreateProject={() => {
                    void navigate({
                      to: "/onboarding",
                      search: {
                        type: "new-project",
                      },
                    });
                  }}
                  onSelect={(projectSlug) => {
                    if (!activeOrganization?.slug) return;
                    void navigate({
                      to: "/$organizationSlug/$projectSlug",
                      params: {
                        organizationSlug: activeOrganization.slug,
                        projectSlug: projectSlug,
                      },
                    });
                  }}
                  projects={projects?.pages.flatMap((page) => page.data) ?? []}
                  showCreateButton={true}
                />
              </li>
            </>
          )}
        </ol>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Open assistant"
                disabled={
                  !projectChat.organizationIdentifier || !projectChat.projectId
                }
                onClick={() => projectChat.toggle()}
                size="icon"
                variant="ghost"
              >
                <Icons.Sparkles className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <KbdGroup>
                <Kbd>{modKeyLabel}</Kbd>
                <span>+</span>
                <Kbd>A</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
          {activeOrganization && <UserDropdown user={session?.user} />}
        </div>
      </nav>
    </header>
  );
}
