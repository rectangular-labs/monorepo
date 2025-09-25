"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { cn } from "@rectangular-labs/ui/utils/cn";
import type { Organization } from "better-auth/plugins";
import { cva, type VariantProps } from "class-variance-authority";
import { BuildingIcon } from "lucide-react";

const organizationLogoSize = cva("", {
  variants: {
    size: {
      sm: "size-6",
      default: "size-8",
      lg: "size-10",
      xl: "size-12",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type OrganizationLogoProps = {
  className?: string;
  isPending?: boolean;
  organization?: Organization;
} & VariantProps<typeof organizationLogoSize>;

/**
 * Displays an organization logo with image and fallback support
 *
 * Renders an organization's logo image when available, with appropriate fallbacks:
 * - Shows a skeleton when isPending is true
 * - Falls back to a building icon when no logo is available
 */
export function OrganizationLogo({
  className,
  isPending,
  organization,
  size,
}: OrganizationLogoProps) {
  const name = organization?.name;
  const src = organization?.logo;
  const normalizedSize = size ?? undefined;

  if (isPending) {
    return (
      <Skeleton
        className={cn(
          "shrink-0 rounded-full",
          organizationLogoSize({ size: normalizedSize }),
          className,
        )}
      />
    );
  }

  return (
    <Avatar
      className={cn(
        "bg-muted",
        organizationLogoSize({ size: normalizedSize }),
        className,
      )}
    >
      <AvatarImage alt={name || "Organization"} src={src || undefined} />
      <AvatarFallback className={"text-foreground"} delayMs={src ? 600 : 0}>
        <BuildingIcon className={"size-[50%]"} />
      </AvatarFallback>
    </Avatar>
  );
}
