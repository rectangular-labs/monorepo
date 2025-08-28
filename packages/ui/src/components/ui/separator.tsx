import type React from "react";
import { cn } from "../../utils/cn";

export interface SeparatorProps extends React.ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = ({
  decorative,
  orientation = "vertical",
  className,
  ...divProps
}: SeparatorProps) => {
  const ariaOrientation = orientation === "vertical" ? orientation : undefined;
  const semanticProps = decorative
    ? { role: "none" }
    : { "aria-orientation": ariaOrientation, role: "separator" };

  return (
    <div
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px",
        className,
      )}
      data-orientation={orientation}
      data-slot="separator-root"
      {...semanticProps}
      {...divProps}
    />
  );
};

Separator.displayName = "Separator";
