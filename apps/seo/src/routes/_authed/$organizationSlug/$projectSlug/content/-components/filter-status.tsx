"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";
import type React from "react";

export type FilterStatusOption<TValue extends string> = {
  value: "all" | TValue;
  label: string;
  count?: number;
};

export function FilterStatus<TValue extends string>({
  label = "Filter by status",
  options,
  value,
  onChange,
  children,
}: {
  label?: string;
  options: FilterStatusOption<TValue>[];
  value: "all" | TValue;
  onChange: (value: "all" | TValue) => void;
  children: React.ReactNode;
}) {
  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>{children}</DropDrawerTrigger>
      <DropDrawerContent align="end">
        <DropDrawerLabel>{label}</DropDrawerLabel>
        {options.map((option) => {
          const isSelected = value === option.value;
          const labelWithCount =
            typeof option.count === "number"
              ? `${option.label} (${option.count})`
              : option.label;
          return (
            <DropDrawerItem
              className="flex flex-1 items-center justify-between font-medium"
              key={option.value}
              onClick={() => onChange(option.value)}
              onSelect={() => onChange(option.value)}
            >
              {labelWithCount}
              {isSelected && <Icons.Check className="text-primary" />}
            </DropDrawerItem>
          );
        })}
      </DropDrawerContent>
    </DropDrawer>
  );
}
