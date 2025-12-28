"use client";

import { useQuery } from "@tanstack/react-query";
import { useMatchRoute, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";

export type ProjectChatCurrentPage =
  | "content-planner"
  | "content-list"
  | "stats"
  | "settings"
  | "article-editor";

type ProjectChatContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  organizationIdentifier: string | null;
  projectId: string | null;
  currentPage: ProjectChatCurrentPage;
  isDesktop: boolean;
};

const ProjectChatContext = createContext<ProjectChatContextValue | null>(null);

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  // simple subscription; good enough for this use case
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function inferCurrentPage(pathname: string): ProjectChatCurrentPage {
  if (pathname.includes("/content")) return "content-list";
  if (pathname.includes("/stats")) return "stats";
  if (pathname.includes("/settings")) return "settings";
  return "settings";
}

export function ProjectChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const matcher = useMatchRoute();
  const projectParams = matcher({
    to: "/$organizationSlug/$projectSlug",
    fuzzy: true,
  });
  const routerState = useRouterState();

  const { data: activeOrganization } = useQuery(
    getApiClientRq().auth.organization.active.queryOptions(),
  );

  const { data: activeProject } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: activeOrganization?.slug ?? "",
        identifier: projectParams ? projectParams.projectSlug : "",
      },
      enabled: !!projectParams && !!activeOrganization?.slug,
    }),
  );

  const value = useMemo<ProjectChatContextValue>(() => {
    const pathname = routerState.location.pathname;
    return {
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
      organizationIdentifier: activeOrganization?.slug ?? null,
      projectId: activeProject?.id ?? null,
      currentPage: inferCurrentPage(pathname),
      isDesktop,
    };
  }, [
    activeOrganization?.slug,
    activeProject?.id,
    isDesktop,
    isOpen,
    routerState.location.pathname,
  ]);

  return (
    <ProjectChatContext.Provider value={value}>
      {children}
    </ProjectChatContext.Provider>
  );
}

export function useProjectChat() {
  const ctx = useContext(ProjectChatContext);
  if (!ctx) {
    throw new Error("useProjectChat must be used within ProjectChatProvider");
  }
  return ctx;
}
