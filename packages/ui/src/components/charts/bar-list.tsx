import { cn } from "@rectangular-labs/ui/utils/cn";
import React from "react";

type Bar<T> = T & {
  key?: string;
  href?: string;
  value: number;
  name: string;
  color?: `var(--chart-${1 | 2 | 3 | 4 | 5})` | (string & {});
};

interface BarListProps<T = unknown>
  extends Omit<React.ComponentPropsWithRef<"div">, "onClick"> {
  data: Bar<T>[];
  valueFormatter?: (value: number, item: Bar<T>) => string;
  onClick?: (payload: Bar<T>) => void;
  sortOrder?: "ascending" | "descending" | "none";
  maxValue?: number;
}

const focusRingClassNames =
  "outline-0 outline-ring outline-offset-2 focus-visible:outline-2";

function BarList<T>({
  data = [],
  valueFormatter = (value) => value.toString(),
  onClick,
  sortOrder = "descending",
  className,
  maxValue,
  ...props
}: BarListProps<T>) {
  const Component = onClick ? "button" : "div";
  const rowHeight = "h-8";

  const sortedData = React.useMemo(() => {
    if (sortOrder === "none") {
      return data;
    }
    return [...data].sort((a, b) => {
      return sortOrder === "ascending" ? a.value - b.value : b.value - a.value;
    });
  }, [data, sortOrder]);
  const widths = React.useMemo(() => {
    const maxValueToUse =
      maxValue ?? Math.max(...sortedData.map((item) => item.value), 0);
    return sortedData.map((item) =>
      item.value === 0 ? 0 : Math.max((item.value / maxValueToUse) * 100, 2),
    );
  }, [sortedData, maxValue]);

  return (
    <div className={cn("flex justify-between space-x-6", className)} {...props}>
      <div className="relative w-full space-y-1.5">
        {sortedData.map((item, index) => (
          <Component
            className={`w-full ${focusRingClassNames} ${onClick ? "rounded-0 rounded-sm transition-colors hover:bg-muted/45" : ""}`}
            key={item.key ?? item.name}
            onClick={() => {
              onClick?.(item);
            }}
          >
            <div
              className={`${rowHeight} flex items-center rounded-sm bg-(--chart-color) transition-all`}
              style={
                {
                  width: `${widths[index]}%`,
                  "--chart-color": item.color ?? "var(--muted)",
                } as React.CSSProperties
              }
            >
              <div className="absolute left-2 flex max-w-full">
                {item.href ? (
                  <a
                    className={`truncate rounded-sm text-muted-foreground text-sm hover:underline hover:underline-offset-2 ${focusRingClassNames}`}
                    href={item.href}
                    onClick={(event) => event.stopPropagation()}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    {item.name}
                  </a>
                ) : (
                  <p className="truncate text-muted-foreground text-sm">
                    {item.name}
                  </p>
                )}
              </div>
            </div>
          </Component>
        ))}
      </div>
      <div className="space-y-1.5">
        {sortedData.map((item) => (
          <p
            className={`flex items-center justify-end truncate text-muted-foreground text-sm leading-none ${rowHeight}`}
            key={item.key ?? item.name}
          >
            {valueFormatter(item.value, item)}
          </p>
        ))}
      </div>
    </div>
  );
}
BarList.displayName = "BarList";

export { BarList, type BarListProps };
