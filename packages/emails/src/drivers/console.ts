import type { EmailOptions, EmailResult } from "../types";

export function consoleDriver(args?: {
  // biome-ignore lint/suspicious/noExplicitAny: user defined
  logger: { log: (...args: any[]) => void };
}) {
  return {
    name: "console",
    send(options: EmailOptions): Promise<EmailResult> {
      const logger = args?.logger ?? console;
      logger.log("Sent Email:", options);

      return Promise.resolve({
        success: true,
      });
    },
  };
}
