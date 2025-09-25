import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { Folder } from "@rectangular-labs/ui/components/icon";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { getFaviconUrl } from "~/lib/get-favicon-url";

type Project = RouterOutputs["project"]["list"]["data"][0];
export function ProjectSwitcherRow({
  project,
  isPending,
}: {
  project?: Project | undefined;
  isPending?: boolean;
}) {
  const faviconUrl = getFaviconUrl(project?.websiteUrl ?? "");

  return (
    <div className="flex items-center gap-3 truncate px-1 py-1.5 md:gap-2 md:px-0 md:py-0">
      {isPending ? (
        <Skeleton className="shrink-0 rounded-full" />
      ) : (
        <Avatar className="size-6 bg-muted">
          <AvatarImage
            alt={project?.name || "Project"}
            src={faviconUrl || undefined}
          />
          <AvatarFallback
            className="text-foreground"
            delayMs={faviconUrl ? 600 : 0}
          >
            <Folder className="size-[50%]" />
          </AvatarFallback>
        </Avatar>
      )}
      {isPending ? (
        <Skeleton className={cn("h-3.5 w-24 max-w-full")} />
      ) : (
        <span
          className={
            "truncate text-left font-semibold text-base leading-tight md:text-sm"
          }
          title={project?.name || project?.websiteUrl || "Project"}
        >
          {project?.name || project?.websiteUrl || "Project"}
        </span>
      )}
    </div>
  );
}
