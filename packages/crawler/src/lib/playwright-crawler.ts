import {
  PlaywrightCrawler,
  type PlaywrightHook,
  type PlaywrightRequestHandler,
  type ProxyConfiguration,
} from "crawlee";

export function createPlaywrightCrawler(
  maxRequestsPerCrawl: number,
  requestHandler: PlaywrightRequestHandler,
  preNavigationHooks: PlaywrightHook[],
  proxyConfiguration?: ProxyConfiguration | undefined,
) {
  return new PlaywrightCrawler({
    ...(proxyConfiguration ? { proxyConfiguration } : {}),
    maxRequestsPerCrawl,
    requestHandler,
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
}
