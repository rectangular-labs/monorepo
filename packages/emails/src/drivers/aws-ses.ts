import type { SESv2Client, SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import type { EmailDriver, EmailOptions, EmailResult } from "../types.js";
import {
  normalizeEmailAddressesToString,
  normalizeEmailAddressToString,
} from "../utils.js";

export function awsSesDriver(
  ...config: NonNullable<ConstructorParameters<typeof SESv2Client>>
) {
  return {
    name: "aws-ses",
    async send(
      options: EmailOptions,
      messageOverrides?: SendEmailCommandInput,
    ): Promise<EmailResult> {
      try {
        const { SESv2Client, SendEmailCommand } = await import(
          "@aws-sdk/client-sesv2"
        );

        const client = new SESv2Client(config);

        const toAddresses = normalizeEmailAddressesToString(options.to);
        const ccAddresses = normalizeEmailAddressesToString(options.cc);
        const bccAddresses = normalizeEmailAddressesToString(options.bcc);

        const command = new SendEmailCommand({
          FromEmailAddress: normalizeEmailAddressToString(options.from),
          Destination: {
            ToAddresses: toAddresses,
            CcAddresses: ccAddresses,
            BccAddresses: bccAddresses,
          },
          Content: {
            Simple: {
              Subject: {
                Data: options.subject,
                Charset: "UTF-8",
              },
              Body: {
                ...(options.html && {
                  Html: {
                    Data: options.html,
                    Charset: "UTF-8",
                  },
                }),
                ...(options.text && {
                  Text: {
                    Data: options.text,
                    Charset: "UTF-8",
                  },
                }),
              },
            },
          },
          ...(options.replyTo && {
            ReplyToAddresses: [normalizeEmailAddressToString(options.replyTo)],
          }),
          ...(messageOverrides && {
            ...messageOverrides,
          }),
        });

        const result = await client.send(command);
        return {
          success: true,
          ...(result.MessageId && { messageId: result.MessageId }),
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send email via AWS SES",
          error,
        };
      }
    },
  } satisfies EmailDriver;
}
