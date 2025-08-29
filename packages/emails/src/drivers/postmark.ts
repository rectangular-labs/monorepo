import type { Message, ServerClient } from "postmark";
import type {
  EmailAddress,
  EmailDriver,
  EmailOptions,
  EmailResult,
} from "../types.js";

function normalizeEmailAddress(addr: string | EmailAddress): string {
  if (typeof addr === "string") return addr;
  return addr.name ? `"${addr.name}" <${addr.address}>` : addr.address;
}

function normalizeEmailAddresses(
  addrs?: string | string[] | EmailAddress | EmailAddress[],
): string[] {
  if (!addrs) return [];
  if (Array.isArray(addrs)) {
    return addrs.map(normalizeEmailAddress);
  }
  return [normalizeEmailAddress(addrs)];
}

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

        const toAddresses = normalizeEmailAddresses(options.to);
        const ccAddresses = normalizeEmailAddresses(options.cc);
        const bccAddresses = normalizeEmailAddresses(options.bcc);

        const emailData: Message = {
          From: normalizeEmailAddress(options.from),
          To: toAddresses.join(", "),
          Subject: options.subject,
          ...(options.html && { HtmlBody: options.html }),
          ...(options.text && { TextBody: options.text }),
          ...(ccAddresses.length > 0 && { Cc: ccAddresses.join(", ") }),
          ...(bccAddresses.length > 0 && { Bcc: bccAddresses.join(", ") }),
          ...(options.replyTo && {
            ReplyTo: normalizeEmailAddress(options.replyTo),
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
