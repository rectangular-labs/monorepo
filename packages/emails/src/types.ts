export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Uint8Array;
  contentType?: string;
  encoding?: string;
}

export interface EmailOptions {
  from: string | EmailAddress;
  to: string | string[] | EmailAddress | EmailAddress[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[] | EmailAddress | EmailAddress[];
  bcc?: string | string[] | EmailAddress | EmailAddress[];
  replyTo?: string | EmailAddress;
  attachments?: EmailAttachment[];
}

export type EmailResult =
  | {
      success: true;
      messageId?: string;
    }
  | {
      success: false;
      message: string;
      error: unknown;
    };

export interface EmailDriver {
  name: string;
  send(options: EmailOptions): Promise<EmailResult>;
}
