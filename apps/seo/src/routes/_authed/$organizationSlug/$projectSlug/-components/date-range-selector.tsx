"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";

export type DateRange = "7d" | "28d" | "90d";

const DATE_RANGE_OPTIONS: {
  value: DateRange;
  label: string;
}[] = [
  {
    value: "7d",
    label: "Last 7 days",
  },
  {
    value: "28d",
    label: "Last 28 days",
  },
  {
    value: "90d",
    label: "Last 90 days",
  },
];

function getLabelForRange(range: DateRange): string {
  const option = DATE_RANGE_OPTIONS.find((opt) => opt.value === range);
  return option?.label ?? "Last 28 days";
}

export interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const currentLabel = getLabelForRange(value);

  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>
        <Button
          className="inline-flex items-center gap-2"
          size="sm"
          variant="outline"
        >
          <Icons.History className="h-4 w-4" />
          <span className="truncate text-xs md:text-sm">{currentLabel}</span>
          <Icons.ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropDrawerTrigger>
      <DropDrawerContent align="end">
        <DropDrawerLabel>Time range</DropDrawerLabel>
        {DATE_RANGE_OPTIONS.map((option) => (
          <DropDrawerItem
            data-selected={option.value === value}
            key={option.value}
            onClick={(event) => {
              event.preventDefault();
              onChange(option.value);
            }}
          >
            <div className="flex flex-1 items-center justify-between gap-2">
              <span className="font-medium text-sm">{option.label}</span>
              {option.value === value ? (
                <Icons.Check className="h-4 w-4 text-primary" />
              ) : null}
            </div>
          </DropDrawerItem>
        ))}
      </DropDrawerContent>
    </DropDrawer>
  );
}
