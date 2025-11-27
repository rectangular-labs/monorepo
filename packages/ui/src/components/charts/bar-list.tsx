import { cn } from "@rectangular-labs/ui/utils/cn";
import React from "react";

type Bar<T> = T & {
  key?: string;
  href?: string;
  value: number;
  name: string;
  color?: `var(--chart-${1 | 2 | 3 | 4 | 5})` | (string & {});
};

interface BarListProps<T = unknown> extends React.ComponentPropsWithRef<"div"> {
  data: Bar<T>[];
  valueFormatter?: (value: number) => string;
  showAnimation?: boolean;
  onValueChange?: (payload: Bar<T>) => void;
  sortOrder?: "ascending" | "descending" | "none";
}

const focusRingClassNames =
  "outline-0 outline-ring outline-offset-2 focus-visible:outline-2";

function BarList<T>({
  data = [],
  valueFormatter = (value) => value.toString(),
  showAnimation = false,
  onValueChange,
  sortOrder = "descending",
  className,
  ...props
}: BarListProps<T>) {
  const Component = onValueChange ? "button" : "div";
  const sortedData = React.useMemo(() => {
    if (sortOrder === "none") {
      return data;
    }
    return [...data].sort((a, b) => {
      return sortOrder === "ascending" ? a.value - b.value : b.value - a.value;
    });
  }, [data, sortOrder]);

  const widths = React.useMemo(() => {
    const maxValue = Math.max(...sortedData.map((item) => item.value), 0);
    return sortedData.map((item) =>
      item.value === 0 ? 0 : Math.max((item.value / maxValue) * 100, 2),
    );
  }, [sortedData]);

  const rowHeight = "h-8";

  return (
    <div className={cn("flex justify-between space-x-6", className)} {...props}>
      <div className="relative w-full space-y-1.5">
        {sortedData.map((item, index) => (
          <Component
            className={cn(
              // base
              "group w-full rounded-sm",
              // focus
              focusRingClassNames,
              onValueChange
                ? [
                    "m-0! cursor-pointer",
                    // hover
                    "hover:bg-muted",
                  ]
                : "",
            )}
            key={item.key ?? item.name}
            onClick={() => {
              onValueChange?.(item);
            }}
          >
            <div
              className={cn(
                // base
                "flex items-center rounded-sm transition-all",
                rowHeight,
                // background color
                onValueChange && "group-hover:bg-(--chart-color)/80",
                // margin and duration
                {
                  "mb-0": index === sortedData.length - 1,
                  "duration-800": showAnimation,
                },
              )}
              style={
                {
                  width: `${widths[index]}%`,
                  "--chart-color": item.color ?? "var(--chart-1)",
                } as React.CSSProperties
              }
            >
              <div className={cn("absolute left-2 flex max-w-full pr-2")}>
                {item.href ? (
                  <a
                    className={cn(
                      // base
                      "truncate whitespace-nowrap rounded-sm text-sm",
                      "text-muted-foreground",
                      "hover:underline hover:underline-offset-2",
                      focusRingClassNames,
                    )}
                    href={item.href}
                    onClick={(event) => event.stopPropagation()}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.name}
                  </a>
                ) : (
                  <p
                    className={cn(
                      // base
                      "truncate whitespace-nowrap text-sm",
                      "text-muted-foreground",
                    )}
                  >
                    {item.name}
                  </p>
                )}
              </div>
            </div>
          </Component>
        ))}
      </div>
      <div>
        {sortedData.map((item, index) => (
          <div
            className={cn(
              "flex items-center justify-end",
              rowHeight,
              index === sortedData.length - 1 ? "mb-0" : "mb-1.5",
            )}
            key={item.key ?? item.name}
          >
            <p
              className={cn(
                // base
                "truncate whitespace-nowrap text-sm leading-none",
                "text-muted-foreground",
              )}
            >
              {valueFormatter(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
BarList.displayName = "BarList";

export { BarList, type BarListProps };
