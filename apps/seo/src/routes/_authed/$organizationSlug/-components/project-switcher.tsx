"use client";

import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { ChevronsUpDown, Plus } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@rectangular-labs/ui/components/ui/command";
import PopoverDrawer from "@rectangular-labs/ui/components/ui/popover-drawer";
import { useIsMobile } from "@rectangular-labs/ui/hooks/use-mobile";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ProjectSwitcherRow } from "./project-switcher.row";

type Projects = RouterOutputs["project"]["list"]["data"];
export type ProjectSwitcherProps<
  T extends React.ComponentType<{ to: string }>,
> = {
  // project list items
  projects: Projects;
  isLoadingProjects?: boolean;
  // Active project management
  activeProjectId: string;
  createHref: (projectSlug: string) => string;
  onSelect: (projectSlug: string) => void;
  anchorComponent?: T;
} & (
  | {
      // Create project
      showCreateButton?: true;
      onCreateProject: () => void; // Redirect to onboarding
    }
  | {
      showCreateButton?: false;
    }
);

export function ProjectSwitcher<T extends React.ComponentType<{ to: string }>>({
  projects,
  isLoadingProjects,
  activeProjectId,
  createHref,
  onSelect,
  anchorComponent,
  ...createProjectProps
}: ProjectSwitcherProps<T>) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const AnchorComponent = anchorComponent ?? "a";

  const onSelectInternal = (value: string) => {
    setOpen(false);
    setSearch("");
    onSelect(value);
  };
  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      router.preloadRoute({
        to: "/onboarding",
        search: {
          type: "new-project",
        },
      });
    }
  };

  return (
    <div>
      <PopoverDrawer
        onOpenChange={onOpenChange}
        open={open}
        trigger={
          <Button
            className="min-w-44 max-w-52 justify-between gap-1"
            title={activeProject?.name ?? activeProject?.websiteUrl}
            variant="outline"
          >
            <span className="truncate">
              {activeProject?.name ??
                activeProject?.websiteUrl ??
                "Select project"}
            </span>
            <ChevronsUpDown
              className="shrink-0 text-muted-foreground"
              size={16}
            />
          </Button>
        }
      >
        <Command
          className={
            isMobile ? "mt-4 rounded-none border-t bg-transparent" : ""
          }
          defaultValue={activeProject?.slug ?? ""}
        >
          <CommandInput onValueChange={setSearch} value={search} />
          <CommandEmpty>No projects found</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {isLoadingProjects &&
                Array.from({ length: 3 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
                  <CommandItem key={i} value={i.toString()}>
                    <ProjectSwitcherRow isPending />
                  </CommandItem>
                ))}
              {projects.map((project) => {
                const href = createHref(project.slug ?? project.id);
                return (
                  <CommandItem
                    asChild
                    key={project.id}
                    onSelect={onSelectInternal}
                    value={project.slug ?? project.websiteUrl}
                  >
                    {/* TODO: Fix this hack
                    hack for tanstack router link to work properly. 
                    We fill in the `to` prop */}
                    <AnchorComponent href={href} to={href}>
                      <ProjectSwitcherRow project={project} />
                    </AnchorComponent>
                  </CommandItem>
                );
              })}
              {createProjectProps.showCreateButton && projects.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    className="px-3 py-3 text-base md:px-2 md:py-1.5 md:text-sm"
                    onSelect={() => {
                      setOpen(false);
                      createProjectProps.onCreateProject();
                    }}
                    value="."
                  >
                    <div className="flex size-6 items-center justify-center">
                      <Plus className="size-[80%]" />
                    </div>
                    Create project
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverDrawer>
    </div>
  );
}
