import type { Root } from "mdast";
import { toString as dataToString } from "mdast-util-to-string";
import getReadingTime from "reading-time";
import type { Plugin } from "unified";
import { getMdastExport } from "./get-mdast-exprt";

export type RemarkReadingTimeOptions = {
  /** Words per minute used for estimation. Defaults to 200. */
  wordsPerMinute?: number;
  /** Field name to assign in file.data for later consumption. */
  fieldName?: string;
};

/**
 * Remark plugin that computes a naive reading time (in minutes) based on the raw file value.
 */
const remarkReadingTime: Plugin<[RemarkReadingTimeOptions?], Root> = (
  options?: RemarkReadingTimeOptions,
) => {
  const { wordsPerMinute = 200, fieldName = "readingTime" } = options ?? {};

  return (tree, file) => {
    const textOnPage = dataToString(tree);
    const readingTime = getReadingTime(textOnPage, {
      wordsPerMinute,
    });

    file.data[fieldName] = readingTime.text;
    tree.children.unshift(getMdastExport(fieldName, readingTime.text));
  };
};

export default remarkReadingTime;
