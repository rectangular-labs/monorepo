import type { SESv2Client, SendEmailCommandInput } from "@aws-sdk/client-sesv2";
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
  addresses?: string | string[] | EmailAddress | EmailAddress[],
): string[] {
  if (!addresses) return [];
  if (Array.isArray(addresses)) {
    return addresses.map(normalizeEmailAddress);
  }
  return [normalizeEmailAddress(addresses)];
}

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

        const toAddresses = normalizeEmailAddresses(options.to);
        const ccAddresses = normalizeEmailAddresses(options.cc);
        const bccAddresses = normalizeEmailAddresses(options.bcc);

        const command = new SendEmailCommand({
          FromEmailAddress: normalizeEmailAddress(options.from),
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
            ReplyToAddresses: [normalizeEmailAddress(options.replyTo)],
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
