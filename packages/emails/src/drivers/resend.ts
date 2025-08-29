import { Buffer } from "node:buffer";
import type { CreateEmailOptions, Resend } from "resend";
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

export function resendDriver(...config: ConstructorParameters<typeof Resend>) {
  return {
    name: "resend",
    async send(
      options: EmailOptions,
      messageOverrides?: CreateEmailOptions,
    ): Promise<EmailResult> {
      try {
        const { Resend } = await import("resend");

        const resend = new Resend(...config);

        const email: CreateEmailOptions = {
          from: normalizeEmailAddress(options.from),
          to: normalizeEmailAddresses(options.to),
          subject: options.subject,
          text: options.text ?? "",
          ...(options.html ? { html: options.html } : {}),
          ...(options.cc ? { cc: normalizeEmailAddresses(options.cc) } : {}),
          ...(options.bcc ? { bcc: normalizeEmailAddresses(options.bcc) } : {}),
          ...(options.replyTo
            ? { replyTo: normalizeEmailAddress(options.replyTo) }
            : {}),
          ...(options.attachments
            ? {
                attachments: options.attachments.map((att) => ({
                  filename: att.filename,
                  content:
                    typeof att.content === "string"
                      ? att.content
                      : Buffer.from(att.content),
                  ...(att.contentType ? { contentType: att.contentType } : {}),
                })),
              }
            : {}),
          ...(messageOverrides && {
            ...messageOverrides,
          }),
        };

        const result = await resend.emails.send(email);

        if (result.error) {
          return {
            success: false,
            message: result.error.message,
            error: result.error,
          };
        }

        return {
          success: true,
          messageId: result.data.id,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send email via Resend",
          error,
        };
      }
    },
  } satisfies EmailDriver;
}
