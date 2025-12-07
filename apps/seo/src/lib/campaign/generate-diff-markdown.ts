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

interface ExtractMarkdownSyntax {
  prefix: string;
  content: string;
  isTable?: boolean;
  isCode?: boolean;
}
/**
 * Extract markdown syntax prefix and content from a line.
 * Returns null if the line should be skipped entirely (empty, horizontal rule, code block).
 * Returns an object with prefix and content if it's markdown syntax that should be partially wrapped.
 */
function extractMarkdownSyntax(
  line: string,
  isCode: boolean,
): ExtractMarkdownSyntax | null {
  const trimmed = line.trim();
  const [startSpace, endSpace] = line.split(trimmed);

  // Empty lines - skip entirely
  if (trimmed === "") return { prefix: "", content: "" };

  // Horizontal rules (---, ***, ___) - skip entirely
  if (/^[-*_]{3,}$/.test(trimmed))
    return { prefix: `${startSpace}${trimmed}`, content: "" };

  // Code blocks (starting with ```) - skip entirely
  if (/^```/.test(trimmed))
    return { prefix: `${startSpace}${trimmed}`, content: "", isCode: !isCode };

  // Headers (starting with #)
  const headerMatch = trimmed.match(/^(#+)\s+(.+)$/);
  if (headerMatch?.[1] && headerMatch[2]) {
    return {
      prefix: `${startSpace}${headerMatch[1]} `,
      content: `${headerMatch[2]}${endSpace}`,
    };
  }

  // Lists (starting with -, *, +)
  const listMatch = trimmed.match(/^([-*+])\s+(.+)$/);
  if (listMatch?.[1] && listMatch[2]) {
    return {
      prefix: `${startSpace}${listMatch[1]} `,
      content: `${listMatch[2]}${endSpace}`,
    };
  }

  // Numbered lists
  const numberedMatch = trimmed.match(/^(\d+\.)\s+(.+)$/);
  if (numberedMatch?.[1] && numberedMatch[2]) {
    return {
      prefix: `${startSpace}${numberedMatch[1]} `,
      content: `${numberedMatch[2]}${endSpace}`,
    };
  }

  // BlockQuotes (starting with >)
  const blockquoteMatch = trimmed.match(/^(>)\s+(.+)$/);
  if (blockquoteMatch?.[1] && blockquoteMatch[2]) {
    return {
      prefix: `${startSpace}${blockquoteMatch[1]} `,
      content: `${blockquoteMatch[2]}${endSpace}`,
    };
  }

  // Tables - return special marker
  if (/\|/.test(trimmed)) {
    return { prefix: "", content: trimmed, isTable: true };
  }

  // Not markdown syntax
  return null;
}

/**
 * Wrap a line with the appropriate tag based on segment type and markdown syntax.
 */
function wrapLine({
  line,
  classes,
  htmlTag,
  markdownSyntax,
}: {
  line: string;
  classes: string;
  htmlTag: string;
  markdownSyntax: ExtractMarkdownSyntax | null;
}): string {
  // If it's markdown syntax, wrap only the content
  if (!markdownSyntax) {
    // Not markdown syntax that we need to be concerned about, wrap entire line if not empty. Empty means newline.
    if (line.trim() === "") return line;
    return `<${htmlTag} class="${classes}">${line}</${htmlTag}>`;
  }

  if (!markdownSyntax.isTable) {
    if (!markdownSyntax.content) {
      return markdownSyntax.prefix;
    }
    // Not a table, wrap the content skip the markdown syntax prefix.
    const wrappedContent = `<${htmlTag} class="${classes}">${markdownSyntax.content}</${htmlTag}>`;
    return markdownSyntax.prefix + wrappedContent;
  }

  // Special handling for tables - wrap each cell content
  const tableRow = markdownSyntax.content;
  const cells: string[] = [];

  let currentCell = "";
  let i = 0;
  while (i < tableRow.length) {
    const char = tableRow[i];

    if (char === "\\" && i + 1 < tableRow.length && tableRow[i + 1] === "|") {
      // Escaped pipe - add both characters to current cell
      currentCell += "\\|";
      i += 2;
    } else if (char === "|") {
      // Unescaped pipe - cell separator
      cells.push(currentCell);
      currentCell = "";
      ++i;
    } else {
      currentCell += char;
      ++i;
    }
  }

  // Add the last cell if there's content. Happens in the odd case where we don't close off the table syntax (it's still valid)
  if (currentCell !== "" || cells.length > 0) {
    cells.push(currentCell);
  }
  /**
   * cells currently looks something like this over the various lines:
   * option 1: [ "", "Feature", "Supported", "Notes", "" ]
   * option 2: [ "", ":---------", "-----------:", ":-------:", "" ]
   * option 3: [ "", "Tables", "✅", "Full \\|\\|support", "" ]
   */
  const wrappedCells = cells.map((cell, index) => {
    const trimmed = cell.trim();
    // Skip empty cells at start/end
    if (trimmed === "" && (index === 0 || index === cells.length - 1)) {
      return "";
    }
    // Skip separator rows (---)
    if (/^[-:]+$/.test(trimmed)) {
      return trimmed;
    }
    // Wrap content in cells
    return trimmed
      ? `<${htmlTag} class="${classes}">${trimmed}</${htmlTag}>`
      : "";
  });

  // Reconstruct table with pipes
  const result = wrappedCells
    .map((cell, index) => {
      if (cell === "" && (index === 0 || index === cells.length - 1)) {
        return "";
      }
      return cell || " ";
    })
    .join("|");
  return `${result}`;
}

/**
 * Convert diff segments to annotated markdown with HTML spans for styling.
 * This allows markdown parsing while preserving diff highlighting.
 */
function segmentsToAnnotatedMarkdown(segments: DiffSegment[]): string {
  return segments
    .map((segment) => {
      let shouldSkipLine = false;
      switch (segment.type) {
        case "insert":
          return segment.text
            .split("\n")
            .map((line) => {
              const markdownSyntax = extractMarkdownSyntax(
                line,
                shouldSkipLine,
              );
              if (markdownSyntax?.isCode || shouldSkipLine) {
                shouldSkipLine = markdownSyntax?.isCode ?? shouldSkipLine;
                return line;
              }
              const result = wrapLine({
                line,
                classes:
                  "no-underline w-full bg-green-500/20 text-green-800 dark:text-green-400",
                htmlTag: "ins",
                markdownSyntax,
              });
              return result;
            })
            .join("\n");
        case "delete":
          return segment.text
            .split("\n")
            .map((line) => {
              const markdownSyntax = extractMarkdownSyntax(
                line,
                shouldSkipLine,
              );
              if (markdownSyntax?.isCode || shouldSkipLine) {
                shouldSkipLine = markdownSyntax?.isCode ?? shouldSkipLine;
                return line;
              }
              const result = wrapLine({
                line,
                classes:
                  "w-full bg-destructive text-destructive-foreground line-through",
                htmlTag: "del",
                markdownSyntax,
              });
              return result;
            })
            .join("\n");
        default:
          return segment.text;
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
