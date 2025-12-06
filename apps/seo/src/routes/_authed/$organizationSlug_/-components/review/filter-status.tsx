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
import type { TreeChangeStatus } from "~/lib/campaign/build-tree";

export function FilterStatus({
  summary,
  statusFilter,
  onStatusFilterChange,
  children,
}: {
  summary: Record<TreeChangeStatus, number> & {
    total: number;
  };
  statusFilter: "all" | TreeChangeStatus;
  onStatusFilterChange: (filter: "all" | TreeChangeStatus) => void;
  children: React.ReactNode;
}) {
  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>{children}</DropDrawerTrigger>
      <DropDrawerContent align="end">
        <DropDrawerLabel>Filter by status</DropDrawerLabel>
        <DropDrawerItem
          className="flex flex-1 items-center justify-between font-medium"
          onClick={() => {
            onStatusFilterChange("all");
          }}
        >
          All ({summary.total})
          {statusFilter === "all" && <Icons.Check className="text-primary" />}
        </DropDrawerItem>
        <DropDrawerItem
          className="flex flex-1 items-center justify-between font-medium"
          onClick={() => {
            onStatusFilterChange("created");
          }}
        >
          Created ({summary.created})
          {statusFilter === "created" && (
            <Icons.Check className="text-primary" />
          )}
        </DropDrawerItem>
        <DropDrawerItem
          className="flex flex-1 items-center justify-between font-medium"
          onClick={() => {
            onStatusFilterChange("updated");
          }}
        >
          Updated ({summary.updated})
          {statusFilter === "updated" && (
            <Icons.Check className="text-primary" />
          )}
        </DropDrawerItem>
        <DropDrawerItem
          className="flex flex-1 items-center justify-between font-medium"
          onClick={() => {
            onStatusFilterChange("deleted");
          }}
        >
          Deleted ({summary.deleted})
          {statusFilter === "deleted" && (
            <Icons.Check className="text-primary" />
          )}
        </DropDrawerItem>
      </DropDrawerContent>
    </DropDrawer>
  );
}
