import type { EmailDriver, EmailOptions, EmailResult } from "./types.js";

export interface EmailClientConfig {
  driver?: EmailDriver;
}

export function createEmailClient(config?: EmailClientConfig) {
  return {
    send: async (options: EmailOptions): Promise<EmailResult> => {
      try {
        if (!config?.driver) {
          const { consoleDriver } = await import("./drivers/console.js");
          const driver = consoleDriver();
          return await driver.send(options);
        }

        return await config.driver.send(options);
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          error,
        };
      }
    },
  };
}
