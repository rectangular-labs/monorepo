import { Dataset, PlaywrightCrawler } from "crawlee";

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({
  // Use the requestHandler to process each of the crawled pages.
  async requestHandler({ request, page, enqueueLinks, log }) {
    const title = await page.title();
    log.info(`Title of ${request.loadedUrl} is '${title}\n'`);

    // Save results as JSON to ./storage/datasets/default
    await Dataset.pushData({ title, url: request.loadedUrl });
    // readability/de-fuddle to get raw text
    // turndown to convert html to markdown

    // Extract links from the current page
    // and add them to the crawling queue.

    // see https://github.com/mishushakov/llm-scraper/blob/main/src/preprocess.ts for more inspiration
    await enqueueLinks({
      strategy: "same-domain",
    });
  },
  // Uncomment this option to see the browser window.
  // headless: false,

  // Let's limit our crawls to make our tests shorter and safer.
  maxRequestsPerCrawl: 50,
});

// Add first URL to the queue and start the crawl.
await crawler.run(["https://google.com"]).then(() => {
  process.exit(0);
});
