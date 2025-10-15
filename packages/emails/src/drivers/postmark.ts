import type { Message, ServerClient } from "postmark";
import type { EmailDriver, EmailOptions, EmailResult } from "../types.js";
import {
  normalizeEmailAddressesToString,
  normalizeEmailAddressToString,
} from "../utils.js";

export function postmarkDriver(
  ...config: ConstructorParameters<typeof ServerClient>
) {
  return {
    name: "postmark",
    async send(
      options: EmailOptions,
      messageOverrides?: Message,
    ): Promise<EmailResult> {
      try {
        const { ServerClient } = await import("postmark");

        const client = new ServerClient(...config);

        const toAddresses = normalizeEmailAddressesToString(options.to);
        const ccAddresses = normalizeEmailAddressesToString(options.cc);
        const bccAddresses = normalizeEmailAddressesToString(options.bcc);

        const emailData: Message = {
          From: normalizeEmailAddressToString(options.from),
          To: toAddresses.join(", "),
          Subject: options.subject,
          ...(options.html && { HtmlBody: options.html }),
          ...(options.text && { TextBody: options.text }),
          ...(ccAddresses.length > 0 && { Cc: ccAddresses.join(", ") }),
          ...(bccAddresses.length > 0 && { Bcc: bccAddresses.join(", ") }),
          ...(options.replyTo && {
            ReplyTo: normalizeEmailAddressToString(options.replyTo),
          }),
          ...(options.attachments && {
            Attachments: options.attachments.map((att) => ({
              Name: att.filename,
              Content:
                typeof att.content === "string"
                  ? btoa(att.content)
                  : btoa(String.fromCharCode(...att.content)),
              ContentType: att.contentType || "application/octet-stream",
              ContentID: null,
            })),
          }),
          ...(messageOverrides && {
            ...messageOverrides,
          }),
        };

        const result = await client.sendEmail(emailData);
        return {
          success: true,
          messageId: result.MessageID,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send email via Postmark",
          error,
        };
      }
    },
  } satisfies EmailDriver;
}
