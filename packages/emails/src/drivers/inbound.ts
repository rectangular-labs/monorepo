import { Buffer } from "node:buffer";
import type {
  IdempotencyOptions,
  Inbound,
  PostEmailsRequest,
} from "@inboundemail/sdk";
import type { EmailDriver, EmailOptions, EmailResult } from "../types.js";
import {
  normalizeEmailAddressesToString,
  normalizeEmailAddressToString,
} from "../utils.js";

export function inboundDriver(
  ...config: ConstructorParameters<typeof Inbound>
) {
  return {
    name: "inbound",
    async send(
      options: EmailOptions,
      messageOverrides?: PostEmailsRequest,
      idempotencyOptions?: IdempotencyOptions,
    ): Promise<EmailResult> {
      try {
        const { Inbound } = await import("@inboundemail/sdk");

        const inbound = new Inbound(...config);

        const { data, error } = await inbound.emails.send(
          {
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
                        : Buffer.from(att.content).toString("base64"),
                    ...(att.contentType
                      ? { contentType: att.contentType }
                      : {}),
                  })),
                }
              : {}),
            ...(messageOverrides && {
              ...messageOverrides,
            }),
          },
          idempotencyOptions,
        );

        if (error) {
          return {
            success: false,
            message: error,
            error: new Error(error),
          };
        }

        return {
          success: true,
          messageId: data?.id ?? "",
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send email via Inbound",
          error,
        };
      }
    },
  } satisfies EmailDriver;
}
