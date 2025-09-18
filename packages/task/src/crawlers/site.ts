// For more information, see https://crawlee.dev/
import {
  PlaywrightCrawler,
  type PlaywrightHook,
  ProxyConfiguration,
} from "crawlee";
import { parseStartingUrl } from "../lib/site-crawler-config/parse-starting-url.js";
import { createCrawlSiteRouter } from "../lib/site-crawler-config/router.js";
import type { SiteCrawlInputSchema } from "../schema/site.js";

export async function crawlSite(input: typeof SiteCrawlInputSchema.infer) {
  const {
    startUrl,
    maxRequestsPerCrawl,
    match = [],
    exclude = [],
    selector = "body",
    waitForSelectorTimeoutMs,
    cookie = [],
    resourceFileTypeExclusions = [],
  } = input;

  console.time("Crawl");
  const preNavigationHooks: PlaywrightHook[] = [
    // Abort requests for certain resource types and add cookies
    async (crawlingContext, _gotoOptions) => {
      const { request, page, log } = crawlingContext;
      // Add cookies to the page
      // Because the crawler has not yet navigated to the page, so the loadedUrl is always undefined. Use the request url instead.
      if (cookie) {
        const cookies = cookie.map((cookie) => {
          return {
            name: cookie.name,
            value: cookie.value,
            url: request.url,
          };
        });
        await page.context().addCookies(cookies);
      }
      // If there are no resource exclusions, return
      if (resourceFileTypeExclusions.length === 0) {
        return;
      }
      await page.route(`**/*.{${resourceFileTypeExclusions.join()}}`, (route) =>
        route.abort("aborted"),
      );
      log.info(`Aborting requests for as this is a resource excluded route`);
    },
  ];
  const router = createCrawlSiteRouter({
    selector,
    waitForSelectorTimeoutMs,
    match,
    exclude,
  });

  const proxyConfiguration = new ProxyConfiguration({
    proxyUrls: [],
  });
  const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    requestHandler: router,
    preNavigationHooks,
    launchContext: {
      launchOptions: {
        args: [
          "--disable-gpu", // Mitigates the "crashing GPU process" issue in Docker containers
        ],
      },
    },
    statusMessageLoggingInterval: 5,
    statusMessageCallback: async ({ state, crawler }) => {
      const inFlight = crawler.autoscaledPool?.currentConcurrency ?? 0;
      await crawler.setStatusMessage(
        `succeeded=${state.requestsFinished} failed=${state.requestsFailed} inFlight=${inFlight}`,
        {
          level: "INFO",
        },
      );
    },
  });

  const startUrls = await parseStartingUrl({
    url: startUrl,
    proxyUrl: await proxyConfiguration.newUrl(),
  });
  await crawler.run(startUrls);
  console.timeEnd("Crawl");
  return crawler;
}
