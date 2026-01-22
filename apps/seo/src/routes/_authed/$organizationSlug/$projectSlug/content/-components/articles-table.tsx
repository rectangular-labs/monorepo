"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/schemas/content-parsers";
import * as Icons from "@rectangular-labs/ui/components/icon";
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
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

function compareMaybeString(a?: string, b?: string) {
  const aValue = (a ?? "").trim().toLowerCase();
  const bValue = (b ?? "").trim().toLowerCase();
  if (!aValue && !bValue) return 0;
  if (!aValue) return 1;
  if (!bValue) return -1;
  return aValue.localeCompare(bValue);
}

function formatDate(value?: Date | null) {
  if (!value) return null;
  if (Number.isNaN(value.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

type ArticleTableRow = {
  id: string;
  primaryKeyword: string;
  title: string;
  slug: string;
  status: SeoFileStatus | "published";
  publishedAt?: Date | null;
  scheduledFor?: Date | null;
};

export function ArticlesTable({
  rows,
  onRowClick,
  getRowActions,
}: {
  rows: ArticleTableRow[];
  onRowClick?: (row: ArticleTableRow) => void;
  getRowActions?: (row: ArticleTableRow) => React.ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "primaryKeyword", desc: false },
  ]);

  const hasPublishedDate = rows.some((row) => row.status === "published");
  const hasScheduledDate = rows.some((row) => row.status === "scheduled");
  const hasDateColumn = hasPublishedDate || hasScheduledDate;
  const dateColumnHeader = hasPublishedDate
    ? "Published"
    : hasScheduledDate
      ? "Scheduled"
      : "Date";

  const columns = useMemo<ColumnDef<ArticleTableRow>[]>(() => {
    const base: ColumnDef<ArticleTableRow>[] = [
      {
        accessorKey: "primaryKeyword",
        header: "Target keyword",
        cell: ({ getValue }) => {
          const value = getValue<string | undefined>();
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
        accessorKey: "title",
        header: "Title",
        cell: ({ getValue }) => getValue<string | undefined>() ?? "—",
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
    ];
    if (hasDateColumn) {
      base.push({
        id: "publishDate",
        header: dateColumnHeader,
        cell: ({ row }) => {
          const dateValue =
            row.original.status === "published"
              ? row.original.publishedAt
              : row.original.scheduledFor;
          return formatDate(dateValue);
        },
        sortingFn: (rowA, rowB) => {
          const aDate =
            rowA.original.status === "published"
              ? rowA.original.publishedAt
              : rowA.original.scheduledFor;
          const bDate =
            rowB.original.status === "published"
              ? rowB.original.publishedAt
              : rowB.original.scheduledFor;
          const aValue = aDate ?? null;
          const bValue = bDate ?? null;
          if (!aValue && !bValue) return 0;
          if (!aValue) return 1;
          if (!bValue) return -1;
          return aValue.getTime() - bValue.getTime();
        },
      });
    }
    if (getRowActions) {
      base.push({
        id: "actions",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => {
          const actions = getRowActions(row.original);
          if (!actions) return null;
          return <span className="flex justify-end">{actions}</span>;
        },
      });
    }
    return base;
  }, [dateColumnHeader, getRowActions, hasDateColumn]);

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
    <Table className="w-full">
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
                    {canSort && sortState === "asc" && (
                      <Icons.FilterAscending className="size-3.5 text-muted-foreground" />
                    )}
                    {canSort && sortState === "desc" && (
                      <Icons.FilterDescending className="size-3.5 text-muted-foreground" />
                    )}
                    {canSort && !sortState && (
                      <Icons.ChevronsUpDown className="size-3.5 text-muted-foreground" />
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
              return (
                <TableCell className={"max-w-90 truncate"} key={cell.id}>
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
