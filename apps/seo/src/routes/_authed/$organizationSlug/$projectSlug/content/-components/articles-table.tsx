"use client";

import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import type { SeoFileStatus } from "@rectangular-labs/core/schemas/content-parsers";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rectangular-labs/ui/components/ui/table";
import { cn } from "@rectangular-labs/ui/utils/cn";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingFn,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

type ArticleTableRow = {
  id: string;
  slug: string;
  primaryKeyword: string;
  author?: string;
  scheduledFor?: string;
  status: SeoFileStatus;
};

function statusLabel(status: SeoFileStatus) {
  switch (status) {
    case "suggested":
      return "Suggested";
    case "queued":
      return "Queued";
    case "planning":
      return "Planning";
    case "writing":
      return "Writing";
    case "reviewing-writing":
      return "Reviewing (writing)";
    case "pending-review":
      return "Pending review";
    case "scheduled":
      return "Scheduled";
    case "published":
      return "Published";
    case "suggestion-rejected":
      return "Suggestion rejected";
    case "review-denied":
      return "Review denied";
    case "deleted":
      return "Deleted";
    default: {
      const never: never = status;
      return never;
    }
  }
}

function formatIsoDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function compareMaybeString(a?: string, b?: string) {
  const aValue = (a ?? "").trim().toLowerCase();
  const bValue = (b ?? "").trim().toLowerCase();
  if (!aValue && !bValue) return 0;
  if (!aValue) return 1;
  if (!bValue) return -1;
  return aValue.localeCompare(bValue);
}

const isoDateSortingFn: SortingFn<ArticleTableRow> = (rowA, rowB, columnId) => {
  const aRaw = rowA.getValue<string | undefined>(columnId);
  const bRaw = rowB.getValue<string | undefined>(columnId);
  const aTime = aRaw ? new Date(aRaw).getTime() : Number.NaN;
  const bTime = bRaw ? new Date(bRaw).getTime() : Number.NaN;
  const a = Number.isFinite(aTime) ? aTime : Number.NEGATIVE_INFINITY;
  const b = Number.isFinite(bTime) ? bTime : Number.NEGATIVE_INFINITY;
  return a - b;
};

function SortIndicator({ state }: { state: false | "asc" | "desc" }) {
  if (state === "asc") {
    return <Icons.FilterAscending aria-hidden="true" className="size-4" />;
  }
  if (state === "desc") {
    return <Icons.FilterDescending aria-hidden="true" className="size-4" />;
  }
  return <Icons.ChevronsUpDown aria-hidden="true" className="size-4" />;
}

type OrganizationMember =
  RouterOutputs["auth"]["organization"]["members"]["members"][number];
export function ArticlesTable({
  rows,
  onRowClick,
  getRowActions,
  members,
}: {
  rows: ArticleTableRow[];
  onRowClick?: (row: ArticleTableRow) => void;
  getRowActions?: (row: ArticleTableRow) => React.ReactNode;
  members: OrganizationMember[];
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "scheduledFor", desc: true },
  ]);

  const memberByUserId = useMemo(() => {
    const map = new Map<string, OrganizationMember>();
    for (const member of members) {
      map.set(member.user.id, member);
    }
    return map;
  }, [members]);

  const resolveAuthorLabel = useCallback(
    (userId?: string) => {
      if (!userId) return "Assistant";
      const member = memberByUserId.get(userId);
      return member?.user.name || member?.user.email || userId;
    },
    [memberByUserId],
  );

  const columns = useMemo<ColumnDef<ArticleTableRow>[]>(() => {
    const base: ColumnDef<ArticleTableRow>[] = [
      {
        accessorKey: "author",
        header: "Author",
        cell: ({ getValue }) => {
          return resolveAuthorLabel(getValue<string | undefined>());
        },
        sortingFn: (rowA, rowB, columnId) => {
          return compareMaybeString(
            resolveAuthorLabel(rowA.getValue<string | undefined>(columnId)),
            resolveAuthorLabel(rowB.getValue<string | undefined>(columnId)),
          );
        },
      },

      {
        accessorKey: "scheduledFor",
        header: "Scheduled for",
        cell: ({ getValue }) => formatIsoDate(getValue<string | undefined>()),
        sortingFn: isoDateSortingFn,
      },
      {
        accessorKey: "primaryKeyword",
        header: "Target keyword",
        cell: ({ getValue }) => {
          const value = getValue<string>();
          return value || "—";
        },
        sortingFn: (rowA, rowB, columnId) => {
          return compareMaybeString(
            rowA.getValue<string | undefined>(columnId),
            rowB.getValue<string | undefined>(columnId),
          );
        },
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ getValue }) => getValue<string>(),
        sortingFn: (rowA, rowB, columnId) => {
          return compareMaybeString(
            rowA.getValue<string | undefined>(columnId),
            rowB.getValue<string | undefined>(columnId),
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge variant="secondary">
            {statusLabel(getValue<SeoFileStatus>())}
          </Badge>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue<SeoFileStatus>(columnId);
          const b = rowB.getValue<SeoFileStatus>(columnId);
          return statusLabel(a).localeCompare(statusLabel(b));
        },
      },
    ];
    if (getRowActions) {
      base.push({
        id: "actions",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => {
          const actions = getRowActions(row.original);
          if (!actions) return null;
          return <div className="flex justify-end">{actions}</div>;
        },
      });
    }
    return base;
  }, [getRowActions, resolveAuthorLabel]);

  const table = useReactTable({
    columns,
    data: rows,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const clickable = typeof onRowClick === "function";

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              if (header.isPlaceholder) {
                return <TableHead key={header.id} />;
              }

              const canSort = header.column.getCanSort();
              const sortState = header.column.getIsSorted();

              return (
                <TableHead key={header.id}>
                  <button
                    className={cn(
                      "inline-flex items-center gap-1.5 font-medium",
                      canSort && "cursor-pointer select-none",
                      !canSort && "cursor-default",
                    )}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    type="button"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {canSort && (
                      <SortIndicator
                        state={sortState === false ? false : sortState}
                      />
                    )}
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            className={clickable ? "cursor-pointer" : undefined}
            key={row.id}
            onClick={() => onRowClick?.(row.original)}
          >
            {row.getVisibleCells().map((cell) => {
              const columnId = cell.column.id;
              const className =
                columnId === "author"
                  ? "max-w-[200px] truncate"
                  : columnId === "primaryKeyword"
                    ? "max-w-[280px] truncate"
                    : columnId === "slug"
                      ? "max-w-[440px] truncate"
                      : undefined;

              return (
                <TableCell className={className} key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
