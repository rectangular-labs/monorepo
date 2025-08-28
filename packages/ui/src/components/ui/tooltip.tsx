"use client";

import { Tooltip as ArkTooltip } from "@ark-ui/react/tooltip";
import type * as React from "react";

import { cn } from "../../utils/cn";

function Tooltip({ ...props }: React.ComponentProps<typeof ArkTooltip.Root>) {
  return (
    <ArkTooltip.Root
      closeDelay={0}
      data-slot="tooltip"
      interactive={true}
      openDelay={0}
      positioning={{
        placement: "bottom",
        gutter: 0,
      }}
      {...props}
    />
  );
}
const TooltipTrigger = ArkTooltip.Trigger;
function TooltipContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ArkTooltip.Content>) {
  return (
    <ArkTooltip.Positioner>
      <ArkTooltip.Content
        className={cn(
          "fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2 z-50 w-fit animate-in text-balance rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs data-[state=closed]:animate-out",
          className,
        )}
        data-slot="tooltip-content"
        {...props}
      >
        <ArkTooltip.Arrow
          style={
            {
              "--arrow-size": "calc(var(--spacing) * 1.2)",
              "--arrow-background": "var(--primary)",
            } as React.CSSProperties
          }
        >
          <ArkTooltip.ArrowTip />
        </ArkTooltip.Arrow>
        {children}
      </ArkTooltip.Content>
    </ArkTooltip.Positioner>
  );
}

export { Tooltip, TooltipContent, TooltipTrigger };
