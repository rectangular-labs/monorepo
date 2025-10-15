import { Buffer } from "node:buffer";
import type { CreateEmailOptions, Resend } from "resend";
import type { EmailDriver, EmailOptions, EmailResult } from "../types.js";
import {
  normalizeEmailAddressesToString,
  normalizeEmailAddressToString,
} from "../utils.js";

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
          from: normalizeEmailAddressToString(options.from),
          to: normalizeEmailAddressesToString(options.to),
          subject: options.subject,
          text: options.text ?? "",
          ...(options.html ? { html: options.html } : {}),
          ...(options.cc
            ? { cc: normalizeEmailAddressesToString(options.cc) }
            : {}),
          ...(options.bcc
            ? { bcc: normalizeEmailAddressesToString(options.bcc) }
            : {}),
          ...(options.replyTo
            ? { replyTo: normalizeEmailAddressToString(options.replyTo) }
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
