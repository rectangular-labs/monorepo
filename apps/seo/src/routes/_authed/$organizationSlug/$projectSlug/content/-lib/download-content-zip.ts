import { strToU8, zipSync } from "fflate";

type ContentItem = {
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  articleType?: string | null;
  heroImage?: string | null;
  heroImageCaption?: string | null;
  contentMarkdown?: string | null;
  publishedAt?: Date | null;
  scheduledFor?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

/**
 * Generates YAML frontmatter from content metadata
 */
function generateFrontmatter(content: ContentItem): string {
  const lines: string[] = ["---"];

  // Add fields in a logical order
  lines.push(`title: "${escapeYamlString(content.title)}"`);
  lines.push(`summary: "${escapeYamlString(content.description)}"`);
  lines.push(`slug: "${content.slug}"`);
  lines.push(`primaryKeyword: "${escapeYamlString(content.primaryKeyword)}"`);

  if (content.articleType) {
    lines.push(`articleType: "${content.articleType}"`);
  }

  if (content.heroImage) {
    lines.push(`heroImage: "${content.heroImage}"`);
  }
  if (content.heroImageCaption) {
    lines.push(
      `heroImageCaption: "${escapeYamlString(content.heroImageCaption)}"`,
    );
  }

  if (content.publishedAt) {
    lines.push(`datePublished: "${content.publishedAt.toISOString()}"`);
  }
  if (content.scheduledFor) {
    lines.push(`datePublished: "${content.scheduledFor.toISOString()}"`);
  }

  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

/**
 * Escapes special characters in YAML strings
 */
function escapeYamlString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Formats a date as YYYYMMDD (without dashes)
 */
function formatDatePrefix(date: Date | null | undefined): string {
  if (!date) {
    return "00000000";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Generates a filename for the content item
 * Format: YYYYMMDD_slug.md
 */
function generateFilename(content: ContentItem): string {
  const date = content.publishedAt ?? content.scheduledFor ?? content.createdAt;
  const datePrefix = formatDatePrefix(date);
  return `${datePrefix}_${content.slug}.md`;
}

/**
 * Creates a markdown file content with frontmatter
 */
function createMarkdownFile(content: ContentItem): string {
  const frontmatter = generateFrontmatter(content);
  const body = content.contentMarkdown ?? "";
  return frontmatter + body;
}

export type DownloadContentZipOptions = {
  contents: ContentItem[];
  zipFilename: string;
};

/**
 * Creates and downloads a zip file containing all content as markdown files with frontmatter
 */
export function downloadContentZip({
  contents,
  zipFilename,
}: DownloadContentZipOptions): void {
  if (contents.length === 0) {
    throw new Error("No content to download");
  }

  // Build the files object for fflate
  const files: Record<string, Uint8Array> = {};

  for (const content of contents) {
    const filename = generateFilename(content);
    const fileContent = createMarkdownFile(content);
    files[filename] = strToU8(fileContent);
  }

  // Create the zip
  const zipped = zipSync(files);

  // Create a blob and download
  const blob = new Blob([new Uint8Array(zipped)], { type: "application/zip" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL
  URL.revokeObjectURL(url);
}

/**
 * Generates a zip filename with the current date
 */
export function generateZipFilename(
  projectSlug: string,
  contentType: "scheduled" | "published",
): string {
  const now = new Date();
  const dateStr = formatDatePrefix(now);
  return `${projectSlug}-${contentType}-content-${dateStr}.zip`;
}
