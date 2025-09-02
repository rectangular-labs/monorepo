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

export function getLastModified({ filepath }: { filepath: string }) {
  const resolvedFilePath = resolveFilepath(filepath);
  const out = execSync(
    `git log -1 --pretty="format:%cI" "${resolvedFilePath}"`,
    {
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  const iso = out.toString().trim();
  return iso;
}
