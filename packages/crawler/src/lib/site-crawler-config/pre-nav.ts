import type { PlaywrightHook } from "crawlee";
import type { Cookie } from "../../schema/site-crawl";

export const createCrawlSitePreNavHook = ({
  cookie,
  resourceFileTypeExclusions,
}: {
  cookie: Cookie[];
  resourceFileTypeExclusions: string[];
}): PlaywrightHook[] => {
  return [
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
};
