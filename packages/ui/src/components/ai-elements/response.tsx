"use client";

import { cn } from "@rectangular-labs/ui/utils/cn";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, components, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      components={{
        ol: ({ children }) => (
          <ol className="ml-4 list-outside list-decimal whitespace-normal">
            {children}
          </ol>
        ),
        ul: ({ children }) => (
          <ul className="ml-4 list-outside list-disc whitespace-normal">
            {children}
          </ul>
        ),
        ...components,
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

Response.displayName = "Response";
