"use client";

import { useIsMobile } from "@rectangular-labs/ui/hooks/use-mobile";
import type React from "react";
import { cn } from "../../utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export function PopoverTooltip({
  children,
  content,
  contentClassName,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  contentClassName?: string;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          className={cn("w-72 p-3 text-sm", contentClassName)}
          sideOffset={8}
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        className={cn("max-w-xs text-left", contentClassName)}
        sideOffset={8}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
