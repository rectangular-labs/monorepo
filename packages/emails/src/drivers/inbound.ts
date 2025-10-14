import { Buffer } from "node:buffer";
import type { EmailDriver, EmailOptions, EmailResult } from "../types.js";
import {
  normalizeEmailAddressesToString,
  normalizeEmailAddressToString,
} from "../utils.js";

interface InboundSendOptions {
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Uint8Array;
    contentType?: string;
  }>;
  // tags are supported by Inbound, preserve if mapped by callers in overrides later
  // tags?: Array<{ name: string; value: string }>;
}

export function inboundDriver(apiKey?: string) {
  return {
    name: "inbound",
    async send(options: EmailOptions): Promise<EmailResult> {
      try {
        const { Inbound } = await import("@inboundemail/sdk");

        const effectiveApiKey = apiKey ?? process.env.INBOUND_API_KEY;
        if (!effectiveApiKey) {
          return {
            success: false,
            message: "INBOUND_API_KEY is not set",
            error: new Error(
              "Missing INBOUND_API_KEY. Provide it to inboundDriver or via process.env.INBOUND_API_KEY.",
            ),
          };
        }

        const inbound = new Inbound(effectiveApiKey);

        const email: InboundSendOptions = {
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
        };

        // Inbound SDK send API mirrors Resend according to docs
        const { data, error } = await inbound.emails.send(email);

        if (error) {
          return {
            success: false,
            message:
              (error as Error).message ?? "Failed to send email via Inbound",
            error,
          };
        }

        return {
          success: true,
          messageId: (data as { id?: string } | undefined)?.id,
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
