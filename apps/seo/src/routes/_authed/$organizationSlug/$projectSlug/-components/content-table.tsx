import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Checkbox } from "@rectangular-labs/ui/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rectangular-labs/ui/components/ui/table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

export type SortOrder = "asc" | "desc";

export type ContentTableSortBy =
  | "title"
  | "status"
  | "strategy"
  | "clicks"
  | "impressions"
  | "ctr"
  | "avgPosition"
  | "primaryKeyword";

export type ContentTableRow = {
  id: string;
  title: string | null;
  slug: string;
  role: string | null;
  status: string;
  primaryKeyword: string;
  strategyId: string | null;
  strategyName: string | null;
  aggregate: {
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
  } | null;
};

function formatNumber(value: number | null, maximumFractionDigits = 0): string {
  if (value === null) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "0.0%";
  return `${(value * 100).toFixed(1)}%`;
}

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function compareNullableString(a: string | null, b: string | null): number {
  return (a ?? "").localeCompare(b ?? "");
}

export function ContentTable({
  rows,
  selectedContentDraftId,
  sortBy,
  sortOrder,
  onChangeSort,
  onChangeSortOrder,
  onOpenContentDetails,
  onDownloadSelected,
  isDownloadingSelected = false,
  showStrategyColumn,
  showRoleColumn = true,
}: {
  rows: ContentTableRow[];
  selectedContentDraftId: string | null;
  sortBy: ContentTableSortBy | null;
  sortOrder: SortOrder;
  onChangeSort: (sortBy: ContentTableSortBy | null) => void;
  onChangeSortOrder: (sortOrder: SortOrder) => void;
  onOpenContentDetails: (contentDraftId: string) => void;
  onDownloadSelected?: (contentDraftIds: string[]) => Promise<void> | void;
  isDownloadingSelected?: boolean;
  showStrategyColumn?: boolean;
  showRoleColumn?: boolean;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();
    if (!normalizedSearch) return rows;

    return rows.filter((row) =>
      [
        row.title,
        row.slug,
        row.primaryKeyword,
        row.status,
        row.role ?? "",
        row.strategyName ?? "",
      ].some((value) => value?.toLowerCase().includes(normalizedSearch)),
    );
  }, [rows, searchInput]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;

    const direction = sortOrder === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.title ?? "").localeCompare(b.title ?? "") * direction;
        case "status":
          return a.status.localeCompare(b.status) * direction;
        case "strategy":
          return (
            compareNullableString(a.strategyName, b.strategyName) * direction
          );
        case "impressions":
          return (
            compareNullableNumber(
              a.aggregate?.impressions ?? null,
              b.aggregate?.impressions ?? null,
            ) * direction
          );
        case "ctr":
          return (
            compareNullableNumber(
              a.aggregate?.ctr ?? null,
              b.aggregate?.ctr ?? null,
            ) * direction
          );
        case "avgPosition":
          return (
            compareNullableNumber(
              a.aggregate?.avgPosition ?? null,
              b.aggregate?.avgPosition ?? null,
            ) * direction
          );
        case "primaryKeyword":
          return a.primaryKeyword.localeCompare(b.primaryKeyword) * direction;
        default:
          return (
            compareNullableNumber(
              a.aggregate?.clicks ?? null,
              b.aggregate?.clicks ?? null,
            ) * direction
          );
      }
    });
  }, [filteredRows, sortBy, sortOrder]);

  const allVisibleSelected =
    sortedRows.length > 0 && sortedRows.every((row) => selectedIds.has(row.id));

  const hasAnyVisibleSelected = sortedRows.some((row) =>
    selectedIds.has(row.id),
  );

  const showStrategy =
    showStrategyColumn ?? rows.some((row) => row.strategyName !== null);

  const columns = useMemo<ColumnDef<ContentTableRow>[]>(() => {
    const draftColumns: ColumnDef<ContentTableRow>[] = [
      {
        cell: ({ row }) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: We just need onClick
          <label
            className="flex h-full w-full items-center p-1"
            htmlFor={`select-${row.original.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              id={`select-${row.original.id}`}
              onCheckedChange={(checked) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (checked) {
                    next.add(row.original.id);
                  } else {
                    next.delete(row.original.id);
                  }
                  return next;
                });
              }}
              onClick={(event) => event.stopPropagation()}
            />
          </label>
        ),
        enableSorting: false,
        header: () => (
          <label
            className="flex h-full w-full items-center p-1"
            htmlFor="select-all"
          >
            <Checkbox
              checked={
                allVisibleSelected
                  ? true
                  : hasAnyVisibleSelected
                    ? "indeterminate"
                    : false
              }
              id="select-all"
              onCheckedChange={(checked) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (checked) {
                    sortedRows.forEach((row) => {
                      next.add(row.id);
                    });
                  } else {
                    sortedRows.forEach((row) => {
                      next.delete(row.id);
                    });
                  }
                  return next;
                });
              }}
              onClick={(event) => event.stopPropagation()}
            />
          </label>
        ),
        id: "selected",
      },
      {
        accessorFn: (row) => row.title,
        cell: ({ row }) => (
          <div className="max-w-[22rem] space-y-0.5">
            <p className="truncate" title={row.original.title ?? ""}>
              {row.original.title}
            </p>
            <p
              className="truncate text-muted-foreground text-xs"
              title={row.original.slug}
            >
              {row.original.slug}
            </p>
          </div>
        ),
        enableSorting: true,
        header: "Title",
        id: "title",
      },
      {
        accessorFn: (row) => row.status,
        cell: ({ row }) => row.original.status,
        enableSorting: true,
        header: "Status",
        id: "status",
      },
    ];

    if (showRoleColumn) {
      draftColumns.push({
        accessorFn: (row) => row.role,
        cell: ({ row }) => row.original.role ?? "",
        enableSorting: false,
        header: "Role",
        id: "role",
      });
    }

    if (showStrategy) {
      draftColumns.push({
        accessorFn: (row) => row.strategyName,
        cell: ({ row }) => (
          <span
            className="block max-w-[16rem] truncate"
            title={row.original.strategyName ?? ""}
          >
            {row.original.strategyName ?? ""}
          </span>
        ),
        enableSorting: true,
        header: "Strategy",
        id: "strategy",
      });
    }

    draftColumns.push(
      {
        accessorFn: (row) => row.aggregate?.clicks ?? null,
        cell: ({ row }) => formatNumber(row.original.aggregate?.clicks ?? 0),
        enableSorting: true,
        header: "Clicks",
        id: "clicks",
      },
      {
        accessorFn: (row) => row.aggregate?.impressions ?? null,
        cell: ({ row }) =>
          formatNumber(row.original.aggregate?.impressions ?? 0),
        enableSorting: true,
        header: "Impressions",
        id: "impressions",
      },
      {
        accessorFn: (row) => row.aggregate?.ctr ?? null,
        cell: ({ row }) => formatPercent(row.original.aggregate?.ctr ?? 0),
        enableSorting: true,
        header: "CTR",
        id: "ctr",
      },
      {
        accessorFn: (row) => row.aggregate?.avgPosition ?? null,
        cell: ({ row }) =>
          formatNumber(row.original.aggregate?.avgPosition ?? 0, 1),
        enableSorting: true,
        header: "Position",
        id: "avgPosition",
      },
      {
        accessorFn: (row) => row.primaryKeyword,
        cell: ({ row }) => (
          <span
            className="block max-w-56 truncate"
            title={row.original.primaryKeyword}
          >
            {row.original.primaryKeyword}
          </span>
        ),
        enableSorting: true,
        header: "Primary keyword",
        id: "primaryKeyword",
      },
    );

    return draftColumns;
  }, [
    allVisibleSelected,
    hasAnyVisibleSelected,
    selectedIds,
    showRoleColumn,
    showStrategy,
    sortedRows,
  ]);

  const table = useReactTable({
    columns,
    data: sortedRows,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Icons.Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search content..."
            value={searchInput}
          />
        </div>
        {onDownloadSelected && selectedIds.size > 0 && (
          <Button
            disabled={isDownloadingSelected}
            onClick={() => onDownloadSelected([...selectedIds])}
            size="sm"
            type="button"
            variant="outline"
          >
            {isDownloadingSelected ? (
              <Icons.Spinner className="size-4 animate-spin" />
            ) : (
              <Icons.Download className="size-4" />
            )}
            Download selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {sortedRows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
          No content found.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[980px] table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    if (header.isPlaceholder) {
                      return <TableHead key={header.id} />;
                    }

                    const canSort = header.column.getCanSort();
                    const headerId = header.column.id;
                    const isSorted = sortBy === headerId;
                    const isSelectedColumn = headerId === "selected";

                    return (
                      <TableHead
                        className={
                          isSelectedColumn
                            ? "w-10 min-w-10 max-w-10"
                            : undefined
                        }
                        key={header.id}
                      >
                        <button
                          className="inline-flex items-center gap-1.5 font-medium"
                          onClick={() => {
                            if (!canSort) return;
                            const nextSortBy = headerId as ContentTableSortBy;
                            if (sortBy !== nextSortBy) {
                              onChangeSort(nextSortBy);
                              onChangeSortOrder("asc");
                              return;
                            }

                            if (sortOrder === "asc") {
                              onChangeSortOrder("desc");
                              return;
                            }

                            onChangeSort(null);
                          }}
                          type="button"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort && isSorted && sortOrder === "asc" && (
                            <Icons.FilterAscending className="size-3.5 text-muted-foreground" />
                          )}
                          {canSort && isSorted && sortOrder === "desc" && (
                            <Icons.FilterDescending className="size-3.5 text-muted-foreground" />
                          )}
                          {canSort && !isSorted && (
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
                  className={
                    selectedContentDraftId === row.original.id
                      ? "cursor-pointer bg-muted/40"
                      : "cursor-pointer"
                  }
                  key={row.id}
                  onClick={() => onOpenContentDetails(row.original.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      onOpenContentDetails(row.original.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className={
                        cell.column.id === "selected"
                          ? "w-10 min-w-10 max-w-10"
                          : undefined
                      }
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
