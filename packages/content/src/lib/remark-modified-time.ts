import { execSync } from "node:child_process";
import console from "node:console";
import { statSync } from "node:fs";
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { getMdastExport } from "./get-mdast-exprt";

export type RemarkModifiedTimeOptions = {
  /** Use file system mtime instead of git log. Defaults to false. */
  useFileSystemMTime?: boolean;
  /** Field name to assign in file.data for later consumption. */
  fieldName?: string;
};

/**
 * Remark plugin that adds a last modified ISO timestamp to `file.data[fieldName]`.
 * It mirrors Astro's recipe but stores on vfile data for consumption by the MDX pipeline.
 */
const remarkModifiedTime: Plugin<[RemarkModifiedTimeOptions?], Root> = (
  options?: RemarkModifiedTimeOptions,
) => {
  const { useFileSystemMTime = false, fieldName = "lastModified" } =
    options ?? {};

  return (tree, file) => {
    const filepath = file.history?.[0];
    if (!filepath) return;
    try {
      let iso: string | null = null;
      if (!useFileSystemMTime) {
        const out = execSync(`git log -1 --pretty="format:%cI" "${filepath}"`, {
          stdio: ["ignore", "pipe", "ignore"],
        });
        console.log("out", out);
        const str = out.toString().trim();
        console.log("str", str);
        iso = str.length > 0 ? str : null;
      }
      if (!iso) {
        const stat = statSync(filepath);
        iso = stat.mtime.toISOString();
      }
      file.data[fieldName] = iso;
      tree.children.unshift(getMdastExport(fieldName, iso));
    } catch {
      // console.log("out", e);
      // Ignore failures and do not set the field
    }
  };
};

export default remarkModifiedTime;
