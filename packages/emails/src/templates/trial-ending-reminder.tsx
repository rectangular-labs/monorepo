import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "jsx-email";

export interface TrialEndingReminderEmailProps {
  username: string;
  daysRemaining: number;
  upgradeLink?: string;
  dashboardLink?: string;
  companyName?: string;
  companyLogo?: string;
}

export const TrialEndingReminderEmail = ({
  username = "there",
  daysRemaining,
  upgradeLink,
  dashboardLink,
  companyName = "Our App",
  companyLogo,
}: TrialEndingReminderEmailProps) => {
  const ctaHref = upgradeLink ?? dashboardLink;
  const ctaLabel = upgradeLink ? "Upgrade now" : "Go to dashboard";
  const plural = daysRemaining === 1 ? "day" : "days";

  return (
    <Html>
      <Head />
      <Preview>
        {companyName} trial ends in {daysRemaining} {plural}
      </Preview>
      <Tailwind production>
        <Body className="font-sans">
          <Container className="mx-auto max-w-lg px-2 py-8 shadow-md md:px-4 dark:border dark:border-gray-200 dark:border-solid dark:shadow-none">
            {companyLogo && (
              <Container>
                <Img
                  alt={companyName}
                  className="rounded-lg"
                  height="40"
                  src={companyLogo}
                  width="40"
                />
              </Container>
            )}
            <Section className="p-6">
              <Container>
                <Heading className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                  Your trial ends in {daysRemaining} {plural}
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  A quick reminder that your {companyName} trial will end in{" "}
                  {daysRemaining} {plural}. To keep access without interruption,
                  please upgrade your plan.
                </Text>
              </Section>
              {ctaHref && (
                <Container>
                  <Button
                    align="center"
                    backgroundColor="#000000"
                    fontSize={16}
                    height={48}
                    href={ctaHref}
                    textColor="#ffffff"
                    width={220}
                  >
                    {ctaLabel}
                  </Button>
                </Container>
              )}
              {ctaHref && (
                <Section className="my-6">
                  <Text className="text-gray-700 dark:text-gray-200">
                    Or copy and paste this URL into your browser:{" "}
                    <Link className="text-black dark:text-white" href={ctaHref}>
                      {ctaHref}
                    </Link>
                  </Text>
                </Section>
              )}
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  If you've got questions or need help deciding, just reply to
                  this message and we can help you choose the best plan.
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Thanks for trying {companyName}!
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const templateName = "trial-ending-reminder";
export const previewProps: TrialEndingReminderEmailProps = {
  username: "there",
  daysRemaining: 3,
  upgradeLink: "https://example.com/upgrade",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: TrialEndingReminderEmailProps) => (
  <TrialEndingReminderEmail {...props} />
);
