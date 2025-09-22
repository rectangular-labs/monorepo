import { log, RobotsTxtFile } from "crawlee";
import { extractUrlLocale, type Locales } from "./extract-url-locale.js";

/**
 *
 * @param {object} param - The parameters for the function
 * @param {string} param.url - The url of the site from which we will try to find sitemap urls from
 * @param {string} param.proxyUrl - The proxy url to use
 * @param {string} param.defaultLocale - The default locale to use
 * @param {boolean} param.onlyParseDefaultLocale - Whether to only parse default locale
 * @returns {string[]} The filtered sitemap URLs.
 */
export async function extractSitemapUrls({
  url,
  proxyUrl,
  defaultLocale = "en",
  onlyParseDefaultLocale = true,
}: {
  url: string;
  proxyUrl?: string | undefined;
  defaultLocale?: Locales | undefined;
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

  return filteredUrls;
}
