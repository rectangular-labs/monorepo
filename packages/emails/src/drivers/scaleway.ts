import type { EmailDriver, EmailOptions, EmailResult } from "../types.js";
import {
  normalizeEmailAddressesToObject,
  normalizeEmailAddressToObject,
} from "../utils.js";

interface ScalewayConfig {
  region: string;
  projectId: string;
  authToken: string;
}

interface ScalewayEmailRequest {
  from: {
    name?: string;
    email: string;
  };
  to: {
    name?: string;
    email: string;
  }[];
  subject: string;
  text?: string;
  html?: string;
  project_id: string;
  attachments?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
  additional_headers?: Array<{
    key: string;
    value: string;
  }>;
}

export function scalewayDriver(config: ScalewayConfig): EmailDriver {
  return {
    name: "scaleway",
    async send(options: EmailOptions): Promise<EmailResult> {
      try {
        const fromAddress = normalizeEmailAddressToObject(options.from);
        const toAddresses = normalizeEmailAddressesToObject(options.to);
        const ccAddresses = normalizeEmailAddressesToObject(options.cc);
        const bccAddresses = normalizeEmailAddressesToObject(options.bcc);

        // Prepare email request
        const emailRequest: ScalewayEmailRequest = {
          from: fromAddress,
          to: toAddresses,
          subject: options.subject,
          project_id: config.projectId,
          ...(options.text && { text: options.text }),
          ...(options.html && { html: options.html }),
          ...(options.attachments && {
            attachments: options.attachments.map((att) => ({
              name: att.filename,
              type: att.contentType || "application/octet-stream",
              content:
                typeof att.content === "string"
                  ? btoa(att.content)
                  : btoa(String.fromCharCode(...att.content)),
            })),
          }),
        };

        // Add CC and BCC as additional headers if present
        const additionalHeaders: Array<{ key: string; value: string }> = [];

        if (ccAddresses.length > 0) {
          additionalHeaders.push({
            key: "Cc",
            value: ccAddresses
              .map((addr) =>
                addr.name ? `"${addr.name}" <${addr.email}>` : addr.email,
              )
              .join(", "),
          });
        }

        if (bccAddresses.length > 0) {
          additionalHeaders.push({
            key: "Bcc",
            value: bccAddresses
              .map((addr) =>
                addr.name ? `"${addr.name}" <${addr.email}>` : addr.email,
              )
              .join(", "),
          });
        }

        if (options.replyTo) {
          const replyToAddress = normalizeEmailAddressToObject(options.replyTo);
          additionalHeaders.push({
            key: "Reply-To",
            value: replyToAddress.name
              ? `"${replyToAddress.name}" <${replyToAddress.email}>`
              : replyToAddress.email,
          });
        }

        if (additionalHeaders.length > 0) {
          emailRequest.additional_headers = additionalHeaders;
        }

        // Send email via Scaleway API
        const response = await fetch(
          `https://api.scaleway.com/transactional-email/v1alpha1/regions/${config.region}/emails`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Auth-Token": config.authToken,
            },
            body: JSON.stringify(emailRequest),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Scaleway API error: ${response.status} ${response.statusText} - ${errorText}`,
          );
        }

        const result = (await response.json()) as {
          emails: {
            id: string;
            message_id: string;
            project_id: string;
            mail_from: string;
            rcpt_to: string;
            mail_rcpt: string;
            rcpt_type: string;
            subject: string;
            created_at: string;
            updated_at: string;
            status: string;
            status_details: string;
            try_count: number;
            last_tries: {
              rank: number;
              tried_at: string;
              code: number;
              message: string;
            }[];
            flags: string[];
          }[];
        };

        const messageId = result.emails[0]?.id;

        return {
          success: true,
          ...(messageId && { messageId }),
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send email via Scaleway",
          error,
        };
      }
    },
  };
}
