import { Buffer } from "node:buffer";
import type { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import type {
  EmailAddress,
  EmailDriver,
  EmailOptions,
  EmailResult,
} from "../types.js";

export type MailersendConfig = {
  apiKey: string;
};

export function mailersendDriver(
  ...config: ConstructorParameters<typeof MailerSend>
) {
  return {
    name: "mailersend",
    async send(
      options: EmailOptions,
      messageOverrides?: (params: EmailParams) => EmailParams,
    ): Promise<EmailResult> {
      try {
        const { MailerSend, EmailParams, Sender, Recipient } = await import(
          "mailersend"
        );

        function normalizeSender(addr: string | EmailAddress): Sender {
          if (typeof addr === "string") return new Sender(addr);
          return new Sender(addr.address, addr.name);
        }

        function normalizeRecipient(addr: string | EmailAddress): Recipient {
          if (typeof addr === "string") return new Recipient(addr);
          return new Recipient(addr.address, addr.name);
        }

        function normalizeRecipients(
          addresses?: string | string[] | EmailAddress | EmailAddress[],
        ): Recipient[] {
          if (!addresses) return [];
          if (Array.isArray(addresses)) {
            return addresses.map(normalizeRecipient);
          }
          return [normalizeRecipient(addresses)];
        }

        const mailerSend = new MailerSend(...config);

        const fromAddr = normalizeSender(options.from);
        const toAddresses = normalizeRecipients(options.to);
        const ccAddresses = normalizeRecipients(options.cc);
        const bccAddresses = normalizeRecipients(options.bcc);
        const replyToAddr = options.replyTo
          ? normalizeRecipient(options.replyTo)
          : undefined;

        const emailParams = new EmailParams()
          .setFrom(fromAddr)
          .setTo(toAddresses)
          .setSubject(options.subject);
        if (options.html) {
          emailParams.setHtml(options.html);
        }
        if (options.text) {
          emailParams.setText(options.text);
        }
        if (options.cc) {
          emailParams.setCc(ccAddresses);
        }
        if (options.bcc) {
          emailParams.setBcc(bccAddresses);
        }
        if (replyToAddr) {
          emailParams.setReplyTo(replyToAddr);
        }
        if (options.attachments) {
          emailParams.setAttachments(
            options.attachments.map((att) => ({
              content:
                typeof att.content === "string"
                  ? att.content
                  : Buffer.from(att.content).toString("base64"),
              filename: att.filename,
              disposition: "attachment",
              contentType: att.contentType,
            })),
          );
        }
        const finalEmailParams = messageOverrides
          ? messageOverrides(emailParams)
          : emailParams;

        const result = await mailerSend.email.send(finalEmailParams);
        return {
          success: true,
          messageId: result.headers?.["x-message-id"],
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send email via MailerSend",
          error,
        };
      }
    },
  } satisfies EmailDriver;
}
