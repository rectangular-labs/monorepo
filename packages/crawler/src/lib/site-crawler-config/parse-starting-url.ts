import { log, RobotsTxtFile } from "crawlee";
import { extractUrlLocale } from "../extract-url-locale.js";

export async function parseStartingUrl({
  url,
  proxyUrl,
  defaultLocale = "en",
  onlyParseDefaultLocale = true,
}: {
  url: string;
  proxyUrl?: string | undefined;
  defaultLocale?: string | undefined;
  onlyParseDefaultLocale?: boolean | undefined;
}) {
  const robots = await RobotsTxtFile.find(url, proxyUrl);
  const { urls } = await robots.parseSitemaps();
  log.info(
    `${urls.length} urls found from sitemap. Filtering internationalized urls.`,
  );

  const filteredUrls = onlyParseDefaultLocale
    ? urls.filter((url) => {
        const locale = extractUrlLocale(url);
        if (!locale || locale.includes(defaultLocale)) {
          return true;
        }
        return false;
      })
    : urls;
  log.info(`${filteredUrls.length} urls after filtering.`);

  // TODO: This is a temporary solution to avoid crawling too many urls. We'll likely inject high ranking urls as needed too.
  // If there's too much urls, we'll just crawl the start url and discover the most relevant urls from the perspective of the user.
  return filteredUrls.length > 0 && filteredUrls.length < 1000
    ? filteredUrls
    : [url];
}
