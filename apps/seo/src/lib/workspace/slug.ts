import type { FsNodePayload } from "@rectangular-labs/core/project";
import {
  moveNode,
  normalizePath,
  resolvePath,
} from "@rectangular-labs/loro-file-system";
import type { LoroTree, LoroTreeNode } from "loro-crdt";

export function slugFromFilePath(path: string): string {
  const normalized = normalizePath(path);
  return normalized.replace(/\.md$/i, "");
}

function isValidSlugSegment(segment: string) {
  return /^[A-Za-z0-9_-]+$/.test(segment);
}

export function slugToFilePath(
  slug: string,
): { ok: true; value: string } | { ok: false; error: Error } {
  const trimmed = slug.trim();
  if (!trimmed) {
    return { ok: false, error: new Error("Slug is required") };
  }
  if (!trimmed.startsWith("/")) {
    return { ok: false, error: new Error("Slug must start with /") };
  }
  if (trimmed === "/") {
    return { ok: false, error: new Error("Slug cannot be /") };
  }
  if (/\s/.test(trimmed)) {
    return { ok: false, error: new Error("Slug cannot contain spaces") };
  }
  if (trimmed.endsWith("/")) {
    return { ok: false, error: new Error("Slug cannot end with /") };
  }
  if (trimmed.toLowerCase().endsWith(".md")) {
    return {
      ok: false,
      error: new Error("Slug should not include the .md extension"),
    };
  }

  const normalized = normalizePath(trimmed);
  const segments = normalized.split("/").filter(Boolean);
  for (const segment of segments) {
    if (segment === "." || segment === "..") {
      return { ok: false, error: new Error("Slug cannot include . or ..") };
    }
    if (!isValidSlugSegment(segment)) {
      return {
        ok: false,
        error: new Error(
          "Slug segments must use only letters, numbers, hyphens, or underscores",
        ),
      };
    }
  }

  return { ok: true, value: `${normalized}.md` };
}

export function slugCollidesWithExistingFile({
  tree,
  nextFilePath,
  currentNodeId,
}: {
  tree: LoroTree<FsNodePayload>;
  nextFilePath: string;
  currentNodeId: string;
}): { ok: true; value: boolean } | { ok: false; error: Error } {
  const existing = resolvePath({ tree, path: nextFilePath });
  if (!existing) return { ok: true, value: false };
  if (existing.data.get("type") !== "file") {
    return {
      ok: false,
      error: new Error("Slug points to a directory, not a file"),
    };
  }
  return { ok: true, value: existing.id !== currentNodeId };
}

function ensureDirectoryPath({
  tree,
  dirPath,
}: {
  tree: LoroTree<FsNodePayload>;
  dirPath: string;
}):
  | { ok: true; value: LoroTreeNode<FsNodePayload> }
  | { ok: false; error: Error } {
  const normalized = normalizePath(dirPath);
  const rootNode = resolvePath({ tree, path: "/" });
  if (!rootNode) {
    return { ok: false, error: new Error("No root node found") };
  }
  if (normalized === "/") return { ok: true, value: rootNode };

  const segments = normalized.split("/").filter(Boolean);
  let currentNode: LoroTreeNode<FsNodePayload> = rootNode;
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const existing = resolvePath({ tree, path: currentPath });
    if (existing) {
      if (existing.data.get("type") !== "dir") {
        return {
          ok: false,
          error: new Error(`Path ${currentPath} exists and is not a directory`),
        };
      }
      currentNode = existing;
      continue;
    }

    const nextNode = currentNode.createNode();
    nextNode.data.set("type", "dir");
    nextNode.data.set("name", segment);
    nextNode.data.set("createdAt", new Date().toISOString());
    currentNode = nextNode;
  }

  return { ok: true, value: currentNode };
}

export function moveFileToSlug({
  tree,
  fromFilePath,
  nextSlug,
}: {
  tree: LoroTree<FsNodePayload>;
  fromFilePath: string;
  nextSlug: string;
}):
  | { ok: true; value: { nextFilePath: string } }
  | { ok: false; error: Error } {
  const fromNode = resolvePath({ tree, path: fromFilePath });
  if (!fromNode) return { ok: false, error: new Error("File not found") };
  if (fromNode.data.get("type") !== "file") {
    return { ok: false, error: new Error("Path is not a file") };
  }

  const nextFilePathResult = slugToFilePath(nextSlug);
  if (!nextFilePathResult.ok) return nextFilePathResult;
  const nextFilePath = nextFilePathResult.value;

  const normalizedFrom = normalizePath(fromFilePath);
  const normalizedNext = normalizePath(nextFilePath);
  if (normalizedFrom === normalizedNext) {
    return { ok: true, value: { nextFilePath: normalizedNext } };
  }

  const collisionResult = slugCollidesWithExistingFile({
    tree,
    nextFilePath: normalizedNext,
    currentNodeId: fromNode.id,
  });
  if (!collisionResult.ok) return collisionResult;
  if (collisionResult.value) {
    return { ok: false, error: new Error("Slug already exists") };
  }

  const nextSegments = normalizedNext.split("/").filter(Boolean);
  const nextName = nextSegments.at(-1);
  if (!nextName) return { ok: false, error: new Error("Invalid slug") };
  const nextDirPath = normalizePath(`/${nextSegments.slice(0, -1).join("/")}`);

  const ensureDirResult = ensureDirectoryPath({ tree, dirPath: nextDirPath });
  if (!ensureDirResult.ok) return ensureDirResult;

  const moveResult = moveNode({
    tree,
    fromPath: normalizedFrom,
    toPath: nextDirPath,
  });
  if (!moveResult.success) {
    return { ok: false, error: new Error(moveResult.message) };
  }

  fromNode.data.set("name", nextName);
  return { ok: true, value: { nextFilePath: normalizedNext } };
}
