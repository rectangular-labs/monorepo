"use client";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../utils/cn";
import { ShortcutDisplay, type ShortcutKeys } from "./shortcut";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 min-w-9 px-2",
        sm: "h-8 min-w-8 px-1.5",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {
  /**
   * The tooltip to display when the toggle is hovered on.
   */
  tooltip?: {
    content: string;
    shortcutKeys?: ShortcutKeys[];
  };
}
const Toggle = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(
  (
    { size, variant, pressed, onPressedChange, tooltip, className, ...props },
    ref,
  ) => {
    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <ToolTipBase {...props} ref={ref} />
          </TooltipTrigger>
          <TooltipContent>
            <span>{tooltip.content}</span>
            {tooltip.shortcutKeys && (
              <ShortcutDisplay shortcutCombos={tooltip.shortcutKeys} />
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <ToolTipBase {...props} ref={ref} />;
  },
);

const ToolTipBase = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ tooltip, variant, size, className, ...props }, ref) => {
  return (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
});

export { Toggle, type ToggleProps, toggleVariants };
