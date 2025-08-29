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

export interface TrialStartEmailProps {
  username: string;
  trialEndsAt: string;
  dashboardLink?: string;
  upgradeLink?: string;
  companyName?: string;
  companyLogo?: string;
}

export const TrialStartEmail = ({
  username = "there",
  trialEndsAt,
  dashboardLink,
  upgradeLink,
  companyName = "Our App",
  companyLogo,
}: TrialStartEmailProps) => {
  const ctaHref = dashboardLink ?? upgradeLink;
  const ctaLabel = dashboardLink ? "Go to dashboard" : "Upgrade now";

  return (
    <Html>
      <Head />
      <Preview>Your {companyName} trial has started</Preview>
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
                  Your trial has started
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Welcome to {companyName}! Your free trial is now active. You
                  have full access to explore the product and see how it fits
                  your workflow.
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Your trial ends on <strong>{trialEndsAt}</strong>.
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
                  Need help getting set up? Reply to this email and we'll be
                  happy to assist.
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Cheers,
                  <br />
                  The {companyName} Team
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const templateName = "trial-start";
export const previewProps: TrialStartEmailProps = {
  username: "there",
  trialEndsAt: "Jan 31, 2026",
  dashboardLink: "https://example.com/dashboard",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: TrialStartEmailProps) => (
  <TrialStartEmail {...props} />
);
