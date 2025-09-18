import { createPlaywrightRouter } from "crawlee";
import { Defuddle as parseWithDefuddle } from "defuddle/node";
import type { Page } from "playwright";
import { extractUrlLocale, type Locales } from "../extract-url-locale.js";

function getPageContent(page: Page, selector: string) {
  return page.evaluate((selector) => {
    // Check if the selector is an XPath
    if (selector.startsWith("/")) {
      const elements = document.evaluate(
        selector,
        document,
        null,
        XPathResult.ANY_TYPE,
        null,
      );
      const result = elements.iterateNext();
      return result ? result.textContent || "" : "";
    } else {
      // Handle as a CSS selector
      const el = document.querySelector(selector) as HTMLElement | null;
      return el?.innerText || "";
    }
  }, selector);
}

async function waitForXPath(page: Page, xpath: string, timeoutMs: number) {
  await page.waitForFunction(
    (xpath) => {
      const elements = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ANY_TYPE,
        null,
      );
      return elements.iterateNext() !== null;
    },
    xpath,
    { timeout: timeoutMs },
  );
}

/**
 * @param config - The config for the crawler
 * @param config.selector - The selector to use for the crawler
 * @param config.waitForSelectorTimeoutMs - The timeout for the selector
 * @param config.match - The match for the crawler
 * @param config.exclude - The exclude for the crawler
 * @param config.onlyEnqueueDefaultLocale - When true, only enqueue links that match the default locale (or have no locale)
 * @param config.defaultLocale - The default locale to keep when filtering (e.g., "en" or "en-us")
 * @returns
 */
export const createCrawlSiteRouter = ({
  selector,
  waitForSelectorTimeoutMs,
  match,
  exclude,
  onlyEnqueueDefaultLocale = true,
  defaultLocale = "en",
}: {
  selector: string;
  waitForSelectorTimeoutMs?: number | undefined;
  match: string[];
  exclude: string[];
  onlyEnqueueDefaultLocale?: boolean | undefined;
  defaultLocale?: Locales | (string & {}) | undefined;
}) => {
  const siteCrawlRouter = createPlaywrightRouter();

  siteCrawlRouter.addDefaultHandler(
    async ({ enqueueLinks, pushData, request, page }) => {
      const title = await page.title();

      console.info(`Crawling: ${request.loadedUrl}...`);

      // Use custom handling for XPath selector
      const timeout = waitForSelectorTimeoutMs ?? 10_000;
      if (selector) {
        if (selector.startsWith("/")) {
          await waitForXPath(page, selector, timeout);
        } else {
          await page.waitForSelector(selector, {
            timeout,
          });
        }
      }

      // Prefer Defuddle extraction, fallback to selector-based text
      let defuddleContentHtml: string | undefined;
      let defuddleContentMarkdown: string | undefined;
      let defuddleDescription: string | undefined;
      try {
        const html = await page.content();
        const parsed = await parseWithDefuddle(html, request.loadedUrl, {
          separateMarkdown: true,
        });
        defuddleContentHtml = parsed.content;
        defuddleContentMarkdown = parsed.contentMarkdown;
        defuddleDescription = parsed.description;
      } catch (_error) {
        // Ignore extraction errors and fall back to selector text
        console.info(`Defuddle extraction failed for ${request.loadedUrl}`);
      }

      const text = await getPageContent(page, selector);

      // Save results as JSON to ./storage/datasets/default
      await pushData({
        title,
        url: request.loadedUrl,
        text,
        description: defuddleDescription,
        contentHtml: defuddleContentHtml,
        contentMarkdown: defuddleContentMarkdown,
        extractor: defuddleContentHtml ? "defuddle" : "selector",
      });

      // Extract links from the current page
      // and add them to the crawling queue.
      await enqueueLinks({
        ...(match.length > 0 ? { globs: match } : {}),
        strategy: "same-domain",
        exclude: exclude,
        // Filter non-default locales when enabled
        transformRequestFunction: (request) => {
          if (!onlyEnqueueDefaultLocale) {
            return request;
          }
          const locale = extractUrlLocale(request.url);
          if (!locale) {
            return request;
          }
          if (locale.includes(defaultLocale)) {
            return request;
          }
          return null;
        },
      });
    },
  );

  return siteCrawlRouter;
};
