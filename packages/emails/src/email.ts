import type { EmailDriver, EmailOptions, EmailResult } from "./types.js";

export interface EmailClientConfig<T extends EmailDriver> {
  driver?: T | undefined;
}

export function createEmailClient<T extends EmailDriver>(
  config?: EmailClientConfig<T>,
): {
  send: T["send"];
} {
  return {
    send: config?.driver?.send
      ? config.driver.send
      : async (options: EmailOptions): Promise<EmailResult> => {
          const { consoleDriver } = await import("./drivers/console.js");
          const driver = consoleDriver();
          return await driver.send(options);
        },
  };
}
