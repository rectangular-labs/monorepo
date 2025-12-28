"use client";

import type { SeoFileStatus } from "@rectangular-labs/api-seo/types";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rectangular-labs/ui/components/ui/table";

export type ArticleTableRow = {
  id: string;
  title: string;
  primaryKeyword: string;
  author: string;
  createdAt: string;
  scheduledFor?: string;
  status: SeoFileStatus;
};

function statusLabel(status: SeoFileStatus) {
  switch (status) {
    case "suggested":
      return "Suggested";
    case "planned":
      return "Planned";
    case "generating":
      return "Generating";
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

export function ArticlesTable({
  rows,
  onRowClick,
}: {
  rows: ArticleTableRow[];
  onRowClick?: (row: ArticleTableRow) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Author</TableHead>
          <TableHead>Date created</TableHead>
          <TableHead>Date published</TableHead>
          <TableHead>Target keyword</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const clickable = typeof onRowClick === "function";
          return (
            <TableRow
              className={clickable ? "cursor-pointer" : undefined}
              key={row.id}
              onClick={() => onRowClick?.(row)}
            >
              <TableCell className="max-w-[240px] truncate">
                {row.author || "—"}
              </TableCell>
              <TableCell>{formatIsoDate(row.createdAt)}</TableCell>
              <TableCell>{formatIsoDate(row.scheduledFor)}</TableCell>
              <TableCell className="max-w-[320px] truncate">
                {row.primaryKeyword || "—"}
              </TableCell>
              <TableCell className="max-w-[520px] truncate">
                {row.title}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{statusLabel(row.status)}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
