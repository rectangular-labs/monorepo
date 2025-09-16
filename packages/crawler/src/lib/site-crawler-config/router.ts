import { createPlaywrightRouter } from "crawlee";
import type { Page } from "playwright";
import { extractUrlLocale, type Locales } from "../extract-url-locale.js";

function getPageHtml(page: Page, selector: string) {
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
    async ({ enqueueLinks, log, pushData, request, page }) => {
      const title = await page.title();

      log.info(`Crawling: ${request.loadedUrl}...`);

      // Use custom handling for XPath selector
      if (selector) {
        if (selector.startsWith("/")) {
          await waitForXPath(page, selector, waitForSelectorTimeoutMs ?? 1000);
        } else {
          await page.waitForSelector(selector, {
            timeout: waitForSelectorTimeoutMs ?? 1000,
          });
        }
      }

      const html = await getPageHtml(page, selector);

      // Save results as JSON to ./storage/datasets/default
      await pushData({ title, url: request.loadedUrl, html });

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
