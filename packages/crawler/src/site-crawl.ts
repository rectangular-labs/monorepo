// For more information, see https://crawlee.dev/
import { Buffer } from "node:buffer";
import { Actor } from "apify";
import { type } from "arktype";
import { log } from "crawlee";
import type { PathLike } from "fs";
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import { isWithinTokenLimit } from "gpt-tokenizer";
import type { Page } from "playwright";
import { createPlaywrightCrawler } from "./lib/playwright-crawler.js";
import { parseStartingUrl } from "./lib/site-crawler-config/parse-starting-url.js";
import { createCrawlSitePreNavHook } from "./lib/site-crawler-config/pre-nav.js";
import { createCrawlSiteRouter } from "./lib/site-crawler-config/router.js";
import { SiteCrawlInputSchema } from "./schema/site-crawl.js";

type Config = {
  maxPagesToCrawl: number;
  selector: string;
  waitForSelectorTimeout: number;
  cookie: string;
  resourceExclusions: string[];
  onVisitPage: (args: {
    page: Page;
    pushData: (data: Record<string, unknown>) => Promise<void>;
  }) => Promise<void>;
  match: string | string[];
  exclude: string | string[];
  outputFileName: string;
  maxFileSize: number;
  maxTokens: number;
  url: string;
};

export async function write(config: Config) {
  let nextFileNameString: PathLike = "";
  const jsonFiles = await glob("storage/datasets/default/*.json", {
    absolute: true,
  });

  console.log(`Found ${jsonFiles.length} files to combine...`);

  let currentResults: Record<string, unknown>[] = [];
  let currentSize: number = 0;
  let fileCounter: number = 1;
  const maxBytes: number = config.maxFileSize
    ? config.maxFileSize * 1024 * 1024
    : Infinity;

  const getStringByteSize = (str: string): number =>
    Buffer.byteLength(str, "utf-8");

  const nextFileName = (): string =>
    `${config.outputFileName.replace(/\.json$/, "")}-${fileCounter}.json`;

  const writeBatchToFile = async (): Promise<void> => {
    nextFileNameString = nextFileName();
    await writeFile(
      nextFileNameString,
      JSON.stringify(currentResults, null, 2),
    );
    console.log(
      `Wrote ${currentResults.length} items to ${nextFileNameString}`,
    );
    currentResults = [];
    currentSize = 0;
    fileCounter++;
  };

  let estimatedTokens: number = 0;

  const addContentOrSplit = async (
    data: Record<string, unknown>,
  ): Promise<void> => {
    const contentString: string = JSON.stringify(data);
    const tokenCount: number | false = isWithinTokenLimit(
      contentString,
      config.maxTokens || Infinity,
    );

    if (typeof tokenCount === "number") {
      if (estimatedTokens + tokenCount > config.maxTokens) {
        // Only write the batch if it's not empty (something to write)
        if (currentResults.length > 0) {
          await writeBatchToFile();
        }
        // Since the addition of a single item exceeded the token limit, halve it.
        estimatedTokens = Math.floor(tokenCount / 2);
        currentResults.push(data);
      } else {
        currentResults.push(data);
        estimatedTokens += tokenCount;
      }
    }

    currentSize += getStringByteSize(contentString);
    if (currentSize > maxBytes) {
      await writeBatchToFile();
    }
  };

  // Iterate over each JSON file and process its contents.
  for (const file of jsonFiles) {
    const fileContent = await readFile(file, "utf-8");
    const data: Record<string, unknown> = JSON.parse(fileContent);
    await addContentOrSplit(data);
  }

  // Check if any remaining data needs to be written to a file.
  if (currentResults.length > 0) {
    await writeBatchToFile();
  }

  return nextFileNameString;
}

await Actor.init();
const rawInput = await Actor.getInput();
const userInput = SiteCrawlInputSchema.or(type.null)(rawInput);

if (userInput instanceof type.errors) {
  log.error(`Invalid input: ${userInput.summary}`);
  throw new Error("Invalid input");
}
if (!userInput) {
  throw new Error("No input provided");
}

log.info("User Input:", { userInput });
const {
  startUrl,
  maxRequestsPerCrawl,
  match = [],
  exclude = [],
  selector = "body",
  waitForSelectorTimeoutMs,
  cookie = [],
  resourceFileTypeExclusions = [],
} = userInput;

console.time("Crawl");
const preNavigationHooks = createCrawlSitePreNavHook({
  cookie,
  resourceFileTypeExclusions,
});
const router = createCrawlSiteRouter({
  selector,
  waitForSelectorTimeoutMs,
  match,
  exclude,
});
const proxyConfiguration = await Actor.createProxyConfiguration();
const crawler = createPlaywrightCrawler(
  maxRequestsPerCrawl,
  router,
  preNavigationHooks,
  proxyConfiguration,
);
const startUrls = await parseStartingUrl({
  url: startUrl,
  proxyUrl: await proxyConfiguration?.newUrl(),
});
await crawler.run(startUrls);
console.timeEnd("Crawl");

await Actor.exit();
