import type { MailDataRequired, MailService } from "@sendgrid/mail";
import type { EmailDriver, EmailOptions, EmailResult } from "../types.js";
import {
  normalizeEmailAddressesToString,
  normalizeEmailAddressToString,
} from "../utils.js";

export type SendgridConfig =
  | {
      apiKey: string;
    }
  | {
      client: Parameters<MailService["setClient"]>[0];
    };

export function sendgridDriver(config: SendgridConfig) {
  return {
    name: "sendgrid",
    async send(
      options: EmailOptions,
      messageOverrides?: MailDataRequired,
    ): Promise<EmailResult> {
      try {
        const sgMail = await import("@sendgrid/mail");

        if ("apiKey" in config) {
          sgMail.default.setApiKey(config.apiKey);
        } else {
          sgMail.default.setClient(config.client);
        }

        const content = (options.html || options.text
          ? [
              ...(options.html
                ? [{ type: "text/html", value: options.html }]
                : []),
              ...(options.text
                ? [{ type: "text/plain", value: options.text }]
                : []),
            ]
          : // biome-ignore lint/suspicious/noExplicitAny: Hacking around for the types now. Sendgrid doesn't export the right types to make type inference work properly.
            [{ type: "text/plain", value: "" }]) as unknown as any;
        const msg: MailDataRequired = {
          from: normalizeEmailAddressToString(options.from),
          to: normalizeEmailAddressesToString(options.to),
          subject: options.subject,
          content,
          ...(options.cc && {
            cc: normalizeEmailAddressesToString(options.cc),
          }),
          ...(options.bcc && {
            bcc: normalizeEmailAddressesToString(options.bcc),
          }),
          ...(options.replyTo && {
            replyTo: normalizeEmailAddressToString(options.replyTo),
          }),
          ...(options.attachments && {
            attachments: options.attachments.map((att) => ({
              filename: att.filename,
              content:
                typeof att.content === "string"
                  ? att.content
                  : btoa(String.fromCharCode(...new Uint8Array(att.content))),
              contentType: att.contentType,
              disposition: "attachment",
            })),
          }),
          ...(messageOverrides && {
            ...messageOverrides,
          }),
        };

        const result = await sgMail.default.send(msg);
        return {
          success: true,
          messageId: result[0]?.headers?.["x-message-id"] as string,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send email via SendGrid",
          error,
        };
      }
    },
  } satisfies EmailDriver;
}
