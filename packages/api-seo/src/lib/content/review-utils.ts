import { apiEnv } from "../../env";
import { getPublicImageUri } from "../project/get-project-image-uri";

type MarkdownLink = {
  text: string;
  url: string;
  index: number;
};

type MarkdownImage = {
  alt: string;
  url: string;
  index: number;
};

export type ArticleReviewAnalysis = {
  internalLinkCount: number;
  externalLinkCount: number;
  inPageAnchorLinkCount: number;
  internalLinks: string[];
  externalLinks: string[];
  inPageAnchorLinks: string[];
  linksTruncated: {
    internal: boolean;
    external: boolean;
    inPageAnchors: boolean;
  };
  imagesTotal: number;
  imagesAllCount: number;
  heroImageCount: number;
  heroImageDetection: "marker" | "before-first-h2" | "first-image" | "none";
  heroImageBeforeFirstH2: boolean;
  nonHeroH2ImageCount: number;
  h2SectionsWithAnyImageCount: number;
  h2Headings: string[];
  outlineHeadingsExpected: string[];
  missingOutlineHeadings: string[];
  emDashCount: number;
  emDashContexts: string[];
  tableBlockCount: number;
  bulletLineCount: number;
  bulletLinesWithBoldHeadingAndColonCount: number;
  bulletFormatExamples: string[];
  imagesMissingAltTextCount: number;
  imagesMissingAltTextExamples: string[];
};

export function repairPublicBucketImageLinks(args: {
  markdown: string;
  orgId: string;
  projectId: string;
  kind?: "content-image";
  bucketUrl?: string;
}): { markdown: string; replacedCount: number } {
  const kind = args.kind ?? "content-image";
  const bucketUrl = (args.bucketUrl ?? apiEnv().SEO_PUBLIC_BUCKET_URL).replace(
    /\/+$/g,
    "",
  );

  const exampleKey = getPublicImageUri({
    orgId: args.orgId,
    projectId: args.projectId,
    kind,
    fileName: "placeholder.webp",
  });
  const prefix = exampleKey.slice(0, exampleKey.lastIndexOf("/") + 1);

  let replacedCount = 0;
  const repaired = args.markdown.replaceAll(
    /!\[(?<alt>[^\]]*)\]\((?<url>[^)\s]+)(?<rest>(?:\s+"[^"]*")?)\)/g,
    (full, _alt: string, url: string, rest: string) => {
      if (!url.startsWith(`${bucketUrl}/`)) return full;

      const pathAndQuery = url.slice(bucketUrl.length + 1);
      if (pathAndQuery.startsWith(prefix)) return full;

      const [pathPart, queryPart] = pathAndQuery.split("?", 2);
      const baseFileName = (pathPart ?? "").split("/").filter(Boolean).pop();
      if (!baseFileName) return full;

      const newUrl = `${bucketUrl}/${prefix}${baseFileName}${
        queryPart ? `?${queryPart}` : ""
      }`;
      replacedCount++;
      return `![${_alt}](${newUrl}${rest ?? ""})`;
    },
  );

  return { markdown: repaired, replacedCount };
}

function normalizeHeading(heading: string): string {
  return heading
    .replaceAll(/[`_*~]/g, "")
    .replaceAll(/[^\p{L}\p{N}\s]/gu, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokensForHeading(heading: string): string[] {
  return normalizeHeading(heading)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function jaccardSimilarity(aTokens: string[], bTokens: string[]): number {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function outlineHeadingIsCovered(expected: string, actualHeadings: string[]) {
  const expectedNorm = normalizeHeading(expected);
  if (!expectedNorm) return false;

  const actualNorms = actualHeadings.map(normalizeHeading);
  if (actualNorms.includes(expectedNorm)) return true;

  for (const actualNorm of actualNorms) {
    if (!actualNorm) continue;
    if (
      actualNorm.includes(expectedNorm) ||
      expectedNorm.includes(actualNorm)
    ) {
      return true;
    }
  }

  const expectedTokens = tokensForHeading(expected);
  for (const actual of actualHeadings) {
    const sim = jaccardSimilarity(expectedTokens, tokensForHeading(actual));
    if (expectedTokens.length >= 2 && sim >= 0.6) return true;
  }

  return false;
}

function extractHeadings(markdown: string, minLevel = 2): string[] {
  const headings: string[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) continue;
    const level = match[1]?.length ?? 0;
    if (level < minLevel) continue;
    headings.push(match[2] ?? "");
  }
  return headings.filter(Boolean);
}

function extractMarkdownLinks(markdown: string): MarkdownLink[] {
  const links: MarkdownLink[] = [];
  const regex = /\[(?<text>[^\]]+)\]\((?<url>[^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(regex)) {
    const index = match.index;
    if (index > 0 && markdown[index - 1] === "!") continue;
    const text = match.groups?.text?.trim();
    const url = match.groups?.url?.trim();
    if (!text || !url) continue;
    links.push({ text, url, index });
  }
  return links;
}

function extractMarkdownImages(markdown: string): MarkdownImage[] {
  const images: MarkdownImage[] = [];
  const regex = /!\[(?<alt>[^\]]*)\]\((?<url>[^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(regex)) {
    const index = match.index ?? -1;
    const alt = match.groups?.alt?.trim() ?? "";
    const url = match.groups?.url?.trim() ?? "";
    if (!url) continue;
    images.push({ alt, url, index });
  }
  return images;
}

function safeHostForUrl(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function normalizeHost(host: string | null): string | null {
  if (!host) return null;
  return host.replace(/^www\./i, "").toLowerCase();
}

function isRelativeUrl(url: string): boolean {
  return url.startsWith("/") || url.startsWith("./") || url.startsWith("../");
}

function countMarkdownTables(markdown: string): number {
  const lines = markdown.split("\n");
  let count = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i]?.trim() ?? "";
    const next = lines[i + 1]?.trim() ?? "";
    const looksLikeHeader = line.startsWith("|") && line.endsWith("|");
    const looksLikeDivider = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(
      next,
    );
    if (looksLikeHeader && looksLikeDivider) {
      count++;
      i++;
    }
  }
  return count;
}

function extractEmDashContexts(markdown: string, max = 10): string[] {
  const contexts: string[] = [];
  const regex = /—/g;
  for (const match of markdown.matchAll(regex)) {
    if (contexts.length >= max) break;
    const index = match.index ?? -1;
    if (index < 0) continue;
    const start = Math.max(0, index - 40);
    const end = Math.min(markdown.length, index + 40);
    contexts.push(markdown.slice(start, end).replaceAll(/\s+/g, " ").trim());
  }
  return contexts;
}

function analyzeBulletFormatting(markdown: string): {
  bulletLineCount: number;
  bulletLinesWithBoldHeadingAndColonCount: number;
  examples: string[];
} {
  const examples: string[] = [];
  let bulletLineCount = 0;
  let bulletLinesWithBoldHeadingAndColonCount = 0;

  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();
    const isBullet = /^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    if (!isBullet) continue;
    bulletLineCount++;

    const ok = /^([-*]|\d+\.)\s+\*\*[^*].*?\*\*:\s+/.test(trimmed);
    if (ok) {
      bulletLinesWithBoldHeadingAndColonCount++;
    } else if (examples.length < 10) {
      examples.push(trimmed.slice(0, 200));
    }
  }

  return {
    bulletLineCount,
    bulletLinesWithBoldHeadingAndColonCount,
    examples,
  };
}

function analyzeHeroAndH2Images(args: {
  markdown: string;
  images: MarkdownImage[];
  h2Headings: string[];
}): {
  heroImageCount: number;
  heroImageDetection: "marker" | "before-first-h2" | "first-image" | "none";
  heroImageBeforeFirstH2: boolean;
  nonHeroH2ImageCount: number;
  h2SectionsWithAnyImageCount: number;
} {
  let heroImageIndex: number | null = null;
  let heroImageDetection:
    | "marker"
    | "before-first-h2"
    | "first-image"
    | "none" = "none";

  const heroMarkerRegex = /(?:^|\n)\s*>\s*\*\*?hero image/gi;
  const markerMatch = heroMarkerRegex.exec(args.markdown);
  if (markerMatch?.index != null) {
    const markerIndex = markerMatch.index;
    const afterMarker = args.images.find((img) => img.index > markerIndex);
    if (afterMarker) {
      heroImageIndex = afterMarker.index;
      heroImageDetection = "marker";
    }
  }

  const firstH2LineIndex = args.markdown
    .split("\n")
    .findIndex((line) => /^##\s+/.test(line.trim()));

  const firstH2CharIndex =
    firstH2LineIndex < 0
      ? -1
      : args.markdown.split("\n").slice(0, firstH2LineIndex).join("\n").length;

  const heroCandidates =
    firstH2CharIndex < 0
      ? []
      : args.images.filter((img) => img.index < firstH2CharIndex);

  if (heroImageIndex == null && heroCandidates.length === 1) {
    heroImageIndex = heroCandidates[0]?.index ?? null;
    heroImageDetection = "before-first-h2";
  }

  if (heroImageIndex == null && args.images.length > 0) {
    heroImageIndex = args.images[0]?.index ?? null;
    heroImageDetection = "first-image";
  }

  const heroImageCount = heroImageIndex == null ? 0 : 1;
  const heroImageBeforeFirstH2 =
    heroImageCount === 1 &&
    firstH2CharIndex >= 0 &&
    heroImageIndex != null &&
    heroImageIndex < firstH2CharIndex;

  const h2Indices: number[] = [];
  {
    const lines = args.markdown.split("\n");
    let offset = 0;
    for (const line of lines) {
      if (/^##\s+/.test(line.trim())) h2Indices.push(offset);
      offset += line.length + 1;
    }
  }

  let h2SectionsWithAnyImageCount = 0;
  let nonHeroH2ImageCount = 0;
  if (h2Indices.length > 0) {
    for (let i = 0; i < h2Indices.length; i++) {
      const start = h2Indices[i] ?? 0;
      const end =
        i + 1 < h2Indices.length
          ? (h2Indices[i + 1] ?? 0)
          : args.markdown.length;
      const imagesInSection = args.images.filter(
        (img) => img.index > start && img.index < end,
      );
      if (imagesInSection.length > 0) h2SectionsWithAnyImageCount++;

      const hasNonHeroImageInSection = imagesInSection.some(
        (img) => heroImageIndex == null || img.index !== heroImageIndex,
      );
      if (hasNonHeroImageInSection) nonHeroH2ImageCount++;
    }
  }

  return {
    heroImageCount,
    heroImageDetection,
    heroImageBeforeFirstH2,
    nonHeroH2ImageCount,
    h2SectionsWithAnyImageCount,
  };
}

export function analyzeArticleMarkdownForReview(args: {
  markdown: string;
  websiteUrl: string;
  outline?: string | null;
}): ArticleReviewAnalysis {
  const websiteHost = normalizeHost(safeHostForUrl(args.websiteUrl));
  const links = extractMarkdownLinks(args.markdown);
  const images = extractMarkdownImages(args.markdown);

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  const inPageAnchorLinks: string[] = [];
  for (const link of links) {
    const url = link.url;
    if (url.startsWith("#")) {
      inPageAnchorLinks.push(url);
      continue;
    }
    if (isRelativeUrl(url)) {
      internalLinks.push(url);
      continue;
    }
    const host = normalizeHost(safeHostForUrl(url));
    if (!host) continue;
    if (websiteHost && host === websiteHost) internalLinks.push(url);
    else externalLinks.push(url);
  }

  const unique = (arr: string[]) => [...new Set(arr)];
  const truncate = (arr: string[], max: number) => arr.slice(0, max);
  const MAX_LINKS_PER_KIND = 50;
  const internalLinksUnique = unique(internalLinks);
  const externalLinksUnique = unique(externalLinks);
  const inPageAnchorLinksUnique = unique(inPageAnchorLinks);

  const h2Headings = extractHeadings(args.markdown, 2).filter(
    (h) => h.trim().length > 0,
  );

  const outlineHeadingsExpected = args.outline
    ? extractHeadings(args.outline, 2)
    : [];
  const missingOutlineHeadings = outlineHeadingsExpected.filter(
    (expected) => !outlineHeadingIsCovered(expected, h2Headings),
  );

  const { bulletLineCount, bulletLinesWithBoldHeadingAndColonCount, examples } =
    analyzeBulletFormatting(args.markdown);

  const imagesMissingAltText = images
    .filter((img) => img.alt.trim().length === 0)
    .slice(0, 10)
    .map((img) => `![${img.alt}](${img.url})`);

  const emDashCount = (args.markdown.match(/—/g) ?? []).length;

  const {
    heroImageCount,
    heroImageDetection,
    heroImageBeforeFirstH2,
    nonHeroH2ImageCount,
    h2SectionsWithAnyImageCount,
  } = analyzeHeroAndH2Images({ markdown: args.markdown, images, h2Headings });

  return {
    internalLinkCount: internalLinksUnique.length,
    externalLinkCount: externalLinksUnique.length,
    inPageAnchorLinkCount: inPageAnchorLinksUnique.length,
    internalLinks: truncate(internalLinksUnique, MAX_LINKS_PER_KIND),
    externalLinks: truncate(externalLinksUnique, MAX_LINKS_PER_KIND),
    inPageAnchorLinks: truncate(inPageAnchorLinksUnique, MAX_LINKS_PER_KIND),
    linksTruncated: {
      internal: internalLinksUnique.length > MAX_LINKS_PER_KIND,
      external: externalLinksUnique.length > MAX_LINKS_PER_KIND,
      inPageAnchors: inPageAnchorLinksUnique.length > MAX_LINKS_PER_KIND,
    },
    imagesTotal: images.length,
    imagesAllCount: images.length,
    heroImageCount,
    heroImageDetection,
    heroImageBeforeFirstH2,
    nonHeroH2ImageCount,
    h2SectionsWithAnyImageCount,
    h2Headings,
    outlineHeadingsExpected,
    missingOutlineHeadings,
    emDashCount,
    emDashContexts: extractEmDashContexts(args.markdown, 10),
    tableBlockCount: countMarkdownTables(args.markdown),
    bulletLineCount,
    bulletLinesWithBoldHeadingAndColonCount,
    bulletFormatExamples: examples,
    imagesMissingAltTextCount: imagesMissingAltText.length,
    imagesMissingAltTextExamples: imagesMissingAltText,
  };
}
