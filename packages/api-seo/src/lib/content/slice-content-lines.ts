import { err, ok, type Result } from "@rectangular-labs/result";

export function sliceContentLines(args: {
  content: string;
  startLine?: number;
  endLine?: number;
}): Result<{ text: string }, Error> {
  const lines = args.content.split("\n");
  const total = lines.length;
  const start = args.startLine ?? 1;
  const end = args.endLine ?? total;

  if (start < 1 || end < 1 || start > total || end > total) {
    return err(new Error("Line range is out of bounds."));
  }
  if (start > end) {
    return err(new Error("startLine cannot be greater than endLine."));
  }
  return ok({ text: lines.slice(start - 1, end).join("\n") });
}
