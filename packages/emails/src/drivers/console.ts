import type { EmailOptions, EmailResult } from "../types";

export function consoleDriver(args?: {
  // biome-ignore lint/suspicious/noExplicitAny: user defined
  logger: { log: (...args: any[]) => void };
}) {
  return {
    name: "console",
    send(options: EmailOptions): Promise<EmailResult> {
      const logger = args?.logger ?? console;
      logger.log("[CONSOLE EMAIL]: ", {
        ...options,
        html: options.html?.length ? "TRUE" : "FALSE",
      });

      return Promise.resolve({
        success: true,
      });
    },
  };
}
