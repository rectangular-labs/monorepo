# @rectangular-labs/emails

A unified email client with multiple provider drivers for sending transactional emails.

## Supported Providers

- **AWS SES** - Amazon Simple Email Service
- **Console** - Logs emails to console (development)
- **MailerSend** - MailerSend transactional email service
- **Nodemailer** - Generic SMTP support
- **Postmark** - Postmark transactional email service
- **Resend** - Resend email API
- **Scaleway** - Scaleway Transactional Email API
- **SendGrid** - SendGrid email service

## Installation

```bash
pnpm add @rectangular-labs/emails
```

## Usage

```typescript
import { createEmailClient } from "@rectangular-labs/emails";

// Create email client with console driver (default)
const emailClient = createEmailClient();

// Send an email
const result = await emailClient.send({
  from: "noreply@yourdomain.com",
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our service!</h1>",
  text: "Welcome to our service!",
});

if (result.success) {
  console.log("Email sent successfully:", result.messageId);
} else {
  console.error("Failed to send email:", result.message);
}
```

## Drivers

### AWS SES

```typescript
import { awsSesDriver } from "@rectangular-labs/emails/drivers/aws-ses";

const emailClient = createEmailClient({
  driver: awsSesDriver({
    region: "us-east-1",
    credentials: {
      accessKeyId: "your-access-key",
      secretAccessKey: "your-secret-key",
    },
  }),
});
```

### Console

Console is the default driver used when no driver is provided to `createEmailClient`. Useful for development and testing.

```typescript
import { createEmailClient } from "@rectangular-labs/emails";
import { consoleDriver } from "@rectangular-labs/emails/drivers/console";

const emailClient = createEmailClient({
  driver: consoleDriver(),
}); // or createEmailClient()
```

### MailerSend

```typescript
import { mailersendDriver } from "@rectangular-labs/emails/drivers/mailersend";

const emailClient = createEmailClient({
  driver: mailersendDriver("your-mailersend-api-key"),
});
```

### Nodemailer (SMTP)

```typescript
import { nodemailerDriver } from "@rectangular-labs/emails/drivers/nodemailer";

const emailClient = createEmailClient({
  driver: nodemailerDriver({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "your-email@gmail.com",
      pass: "your-app-password",
    },
  }),
});
```

### Postmark

```typescript
import { postmarkDriver } from "@rectangular-labs/emails/drivers/postmark";

const emailClient = createEmailClient({
  driver: postmarkDriver("your-postmark-server-token"),
});
```

### Resend

```typescript
import { resendDriver } from "@rectangular-labs/emails/drivers/resend";

const emailClient = createEmailClient({
  driver: resendDriver("your-resend-api-key"),
});
```

### Scaleway

```typescript
import { createEmailClient } from "@rectangular-labs/emails";
import { scalewayDriver } from "@rectangular-labs/emails/drivers/scaleway";

const emailClient = createEmailClient({
  driver: scalewayDriver({
    region: "fr-par",
    projectId: "your-project-id",
    authToken: "your-auth-token",
  }),
});
```

### SendGrid

```typescript
import { sendgridDriver } from "@rectangular-labs/emails/drivers/sendgrid";

const emailClient = createEmailClient({
  driver: sendgridDriver("your-sendgrid-api-key"),
});
```

## Email Options

All drivers support the same email options:

```typescript
interface EmailOptions {
  // CORE
  from: string | EmailAddress;
  to: string | string[] | EmailAddress | EmailAddress[];
  subject: string;
  html?: string;
  text?: string;
  
  // additional parties
  cc?: string | string[] | EmailAddress | EmailAddress[];
  bcc?: string | string[] | EmailAddress | EmailAddress[];
  replyTo?: string | EmailAddress;
  
  // Attachments
  attachments?: EmailAttachment[];
}
```

## License

MIT
