import { Buffer } from "node:buffer";
import type { createTransport, SendMailOptions } from "nodemailer";
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

export function nodemailerDriver(
  ...config: Parameters<typeof createTransport>
) {
  return {
    name: "nodemailer",
    async send(
      options: EmailOptions,
      messageOverrides?: SendMailOptions,
    ): Promise<EmailResult> {
      try {
        const nodemailer = await import("nodemailer");

        const transporter = nodemailer.default.createTransport(...config);

        const mailOptions: SendMailOptions = {
          from: normalizeEmailAddress(options.from),
          to: normalizeEmailAddresses(options.to),
          subject: options.subject,
          ...(options.html && { html: options.html }),
          ...(options.text && { text: options.text }),
          ...(options.cc && { cc: normalizeEmailAddresses(options.cc) }),
          ...(options.bcc && { bcc: normalizeEmailAddresses(options.bcc) }),
          ...(options.replyTo && {
            replyTo: normalizeEmailAddress(options.replyTo),
          }),
          ...(options.attachments && {
            attachments: options.attachments.map((att) => ({
              filename: att.filename,
              content:
                typeof att.content === "string"
                  ? att.content
                  : Buffer.from(att.content),
              contentType: att.contentType,
              encoding: att.encoding,
            })),
          }),
          ...(messageOverrides && {
            ...messageOverrides,
          }),
        };

        const info = await transporter.sendMail(mailOptions);
        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send email via Nodemailer",
          error,
        };
      }
    },
  } satisfies EmailDriver;
}
