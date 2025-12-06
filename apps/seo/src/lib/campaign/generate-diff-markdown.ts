import type { Delta } from "loro-crdt";

interface DiffSegment {
  type: "retain" | "insert" | "delete";
  text: string;
}

/**
 * Apply a diff (array of delta operations) to the original text
 * and produce an array of segments with their types.
 *
 * @param originalText - The original text before changes
 * @param diff - Array of delta operations from loro-crdt TextDiff
 * @returns Array of segments with type and text
 */
function convertDiffToSegments(
  originalText: string,
  diff: Delta<string>[],
): DiffSegment[] {
  const segments: DiffSegment[] = [];
  let originalIndex = 0;

  for (const op of diff) {
    if (op.retain) {
      const text = originalText.slice(originalIndex, originalIndex + op.retain);
      if (text.length > 0) {
        segments.push({ type: "retain", text });
      }

      originalIndex += op.retain;
    } else if (op.delete) {
      const text = originalText.slice(originalIndex, originalIndex + op.delete);
      if (text.length > 0) {
        segments.push({ type: "delete", text });
      }

      originalIndex += op.delete;
    } else if (op.insert) {
      if (op.insert.length > 0) {
        segments.push({ type: "insert", text: op.insert });
      }
    }
  }

  // Handle any remaining text from original (shouldn't happen with valid diff, but jic)
  if (originalIndex < originalText.length) {
    segments.push({
      type: "retain",
      text: originalText.slice(originalIndex),
    });
  }

  return segments;
}

/**
 * Convert diff segments to annotated markdown with HTML spans for styling.
 * This allows markdown parsing while preserving diff highlighting.
 */
function segmentsToAnnotatedMarkdown(segments: DiffSegment[]): string {
  return segments
    .map((segment) => {
      // Escape any existing HTML in the text to prevent XSS
      const escapedText = segment.text
        .replace(/&/g, "&amp;")
        .replace(/'/g, "&apos;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      switch (segment.type) {
        case "insert":
          return escapedText
            .split("\n")
            .map(
              (line) =>
                `<span class="bg-green-500/20 text-green-800 dark:text-green-400">${line}</span>`,
            )
            .join("\n");
        case "delete":
          return escapedText
            .split("\n")
            .map(
              (line) =>
                `<span class="rounded-xs bg-destructive text-destructive-foreground line-through">${line}</span>`,
            )
            .join("\n");
        default:
          return escapedText;
      }
    })
    .join("");
}

export function generateDiffMarkdown(
  originalText: string,
  diff: Delta<string>[],
): string {
  const segments = convertDiffToSegments(originalText, diff);
  return segmentsToAnnotatedMarkdown(segments);
}
