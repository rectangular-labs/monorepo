"use client";
import { Toggle as TogglePrimitive } from "@ark-ui/react";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../../utils/cn";

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
  extends React.ComponentPropsWithRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

function Toggle({ size, variant, className, ...props }: ToggleProps) {
  return (
    <TogglePrimitive.Root
      className={cn(toggleVariants({ variant, size, className }))}
      data-slot="toggle"
      {...props}
    />
  );
}

function ToggleIndicator({
  children,
  fallback,
  ...props
}: React.ComponentPropsWithRef<typeof TogglePrimitive.Indicator>) {
  return (
    <TogglePrimitive.Indicator {...props}>{children}</TogglePrimitive.Indicator>
  );
}

export { Toggle, type ToggleProps, toggleVariants, ToggleIndicator };
