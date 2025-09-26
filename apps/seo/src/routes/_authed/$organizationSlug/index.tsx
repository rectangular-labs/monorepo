import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@rectangular-labs/ui/components/ui/toggle-group";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React from "react";
import { getApiClientRq } from "~/lib/api";
import { getFaviconUrl } from "~/lib/get-favicon-url";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

export const Route = createFileRoute("/_authed/$organizationSlug/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery(
    getApiClientRq().project.list.infiniteOptions({
      input(pageParam) {
        return {
          organizationIdentifier: organizationSlug,
          limit: 10,
          cursor: pageParam,
        };
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageCursor ?? undefined,
    }),
  );

  // Flatten all pages of projects
  const allProjects = data?.pages.flatMap((page) => page.data) ?? [];
  const filteredProjects = allProjects.filter((project) =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor your SEO projects
          </p>
        </div>
        <NewProjectButton />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-sm flex-1">
          <div className="relative">
            <Icons.Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              value={searchQuery}
            />
          </div>
        </div>

        <ToggleGroup
          onValueChange={(value) =>
            value && setViewMode(value as "grid" | "list")
          }
          type="single"
          value={viewMode}
        >
          <ToggleGroupItem aria-label="Grid view" value="grid">
            <Icons.Grid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="List view" value="list">
            <Icons.List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Content */}
      <LoadingError
        error={error}
        errorDescription="There was an error loading your projects. Please try again."
        errorTitle="Error loading projects"
        isLoading={isLoading}
        loadingComponent={<ProjectSkeletons viewMode={viewMode} />}
      />
      {!isLoading && filteredProjects.length === 0 && (
        <EmptyState searchQuery={searchQuery} />
      )}
      {!isLoading && filteredProjects.length > 0 && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4",
          )}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              organizationSlug={organizationSlug}
              project={project}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-6">
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="outline"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

type Project = RouterOutputs["project"]["list"]["data"][0];
interface ProjectCardProps {
  organizationSlug: string;
  project: Project;
  viewMode: "grid" | "list";
}

function ProjectCard({
  organizationSlug,
  project,
  viewMode,
}: ProjectCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };
  const faviconUrl = getFaviconUrl(project.websiteUrl);

  if (viewMode === "list") {
    return (
      <Card className="relative transition-all duration-200 hover:bg-muted/50 hover:shadow-md">
        <Link
          className="absolute inset-0 z-10"
          params={{
            organizationSlug,
            projectSlug: project.slug || project.id,
          }}
          to="/$organizationSlug/$projectSlug"
        >
          <span className="sr-only">View {project.name} project</span>
        </Link>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-3">
              {/* Favicon */}
              <div className="flex-shrink-0">
                {faviconUrl ? (
                  <img
                    alt={`${project.name} favicon`}
                    className="h-8 w-8 rounded-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    src={faviconUrl}
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted">
                    <Icons.ArrowUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Title and URL */}
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="truncate font-semibold text-lg">
                  {project.name}
                </CardTitle>

                <p className="truncate text-muted-foreground text-sm">
                  {project.websiteUrl}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right text-muted-foreground text-sm">
              <p>Updated {formatDate(project.updatedAt)}</p>
              <p>Created {formatDate(project.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative transition-all duration-200 hover:bg-muted/50 hover:shadow-md">
      <Link
        className="absolute inset-0 z-10"
        params={{
          organizationSlug,
          projectSlug: project.slug || project.id,
        }}
        to="/$organizationSlug/$projectSlug"
      >
        <span className="sr-only">View {project.name} project</span>
      </Link>
      <CardHeader>
        <div className="flex items-center gap-3">
          {/* Favicon */}
          <div className="flex-shrink-0">
            {faviconUrl ? (
              <img
                alt={`${project.name} favicon`}
                className="h-8 w-8 rounded-sm"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                src={faviconUrl}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted">
                <Icons.ArrowUp className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Title and Status */}
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="truncate font-semibold text-lg">
              {project.name}
            </CardTitle>
            <p className="truncate text-muted-foreground text-sm">
              {project.websiteUrl}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>Updated {formatDate(project.updatedAt)}</span>
          <Icons.ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectSkeletons({ viewMode }: { viewMode: "grid" | "list" }) {
  const skeletons = Array.from({ length: 6 }, (_, i) => i);

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <Card key={i}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-3">
                  {/* Favicon skeleton */}
                  <Skeleton className="h-8 w-8 flex-shrink-0 rounded-sm" />

                  {/* Title and URL skeleton */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="flex-shrink-0 space-y-1 text-right">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {skeletons.map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {/* Favicon skeleton */}
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-sm" />

              {/* Title and URL skeleton */}
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icons.Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-2 font-semibold text-lg">
        {searchQuery ? "No projects found" : "No projects yet"}
      </h3>
      <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
        {searchQuery
          ? `No projects match "${searchQuery}". Try adjusting your search.`
          : "Get started by creating your first SEO project."}
      </p>
      {!searchQuery && <NewProjectButton />}
    </div>
  );
}

function NewProjectButton() {
  const navigate = useNavigate();

  const handleNewProject = () => {
    void navigate({
      to: "/onboarding",
      search: {
        type: "new-project",
      },
    });
  };

  return (
    <Button onClick={handleNewProject}>
      <Icons.Plus className="mr-2 h-4 w-4" />
      New Project
    </Button>
  );
}
