import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const resolveFilepath = (candidate?: string | null): string | null => {
  if (!candidate) return null;
  if (existsSync(candidate)) return candidate;
  try {
    const out = execSync(`git ls-files "../**/*/${candidate}"`, {
      stdio: ["ignore", "pipe", "ignore"],
    });
    const matches = out
      .toString()
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const preferred = matches.find((m) => m.endsWith(candidate));
    return preferred ?? matches[0] ?? null;
  } catch {
    return null;
  }
};

export function getTimestamps({ filepath }: { filepath: string }) {
  const resolvedFilePath = resolveFilepath(filepath);
  if (!resolvedFilePath) return null;
  try {
    const lastModified = execSync(
      `git log -1 --pretty="format:%cI" "${resolvedFilePath}"`,
      {
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    const createdAt = execSync(
      `git log --follow --pretty="format:%aI" --reverse "${resolvedFilePath}" | head -1`,
      {
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    const lastModifiedIso = lastModified.toString().trim();
    const createdAtIso = createdAt.toString().trim();
    return { lastModified: lastModifiedIso, createdAt: createdAtIso };
  } catch {
    return null;
  }
}
