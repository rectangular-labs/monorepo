import { render } from "jsx-email";
import { createEmailClient } from "../src/email.js";
import {
  TrialEndedEmail,
  previewProps as trialEndedPreviewProps,
} from "../src/templates/trial-ended.js";
import {
  TrialEndingReminderEmail,
  previewProps as trialEndingPreviewProps,
} from "../src/templates/trial-ending-reminder.js";
import {
  TrialStartEmail,
  previewProps as trialStartPreviewProps,
} from "../src/templates/trial-start.js";

const emailClient = createEmailClient();
export async function sendTrialStartEmail(to: string) {
  const html = await render(<TrialStartEmail {...trialStartPreviewProps} />);
  const result = await emailClient.send({
    from: "noreply@yourdomain.com",
    to,
    subject: "Your trial has started",
    html,
  });
  return result;
}

export async function sendTrialEndingReminderEmail(to: string) {
  const html = await render(
    <TrialEndingReminderEmail {...trialEndingPreviewProps} />,
  );
  const result = await emailClient.send({
    from: "noreply@yourdomain.com",
    to,
    subject: `Your trial ends in ${trialEndingPreviewProps.daysRemaining} days`,
    html,
  });
  return result;
}

export async function sendTrialEndedEmail(to: string) {
  const html = await render(<TrialEndedEmail {...trialEndedPreviewProps} />);
  const result = await emailClient.send({
    from: "noreply@yourdomain.com",
    to,
    subject: "Your trial has ended",
    html,
  });
  return result;
}

async function main() {
  await sendTrialStartEmail("user@example.com");
  await sendTrialEndingReminderEmail("user@example.com");
  await sendTrialEndedEmail("user@example.com");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
