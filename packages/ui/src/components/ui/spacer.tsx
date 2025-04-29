import type * as React from "react";

type SpacerOrientation = "horizontal" | "vertical";

interface SpacerProps extends React.ComponentPropsWithRef<"div"> {
  orientation?: SpacerOrientation;
  size?: string | number;
}

export const Spacer = ({
  orientation = "horizontal",
  size,
  className = "",
  style = {},
  ...props
}: SpacerProps) => {
  const computedStyle = {
    ...style,
    ...(orientation === "horizontal" && !size && { flex: 1 }),
    ...(size && {
      width: orientation === "vertical" ? "1px" : size,
      height: orientation === "horizontal" ? "1px" : size,
    }),
  };

  return (
    <div
      {...props}
      className={className}
      style={computedStyle}
      role={"none" as const}
    />
  );
};

Spacer.displayName = "Spacer";
