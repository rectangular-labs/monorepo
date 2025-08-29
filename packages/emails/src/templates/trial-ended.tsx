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

export interface TrialEndedEmailProps {
  username: string;
  upgradeLink?: string;
  companyName?: string;
  companyLogo?: string;
  graceDays?: number;
}

export const TrialEndedEmail = ({
  username = "there",
  upgradeLink,
  companyName = "Our App",
  companyLogo,
  graceDays = 0,
}: TrialEndedEmailProps) => {
  const plural = graceDays === 1 ? "day" : "days";

  return (
    <Html>
      <Head />
      <Preview>Your {companyName} trial has ended</Preview>
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
                  Your trial has ended
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Your free trial for {companyName} has ended.{" "}
                  {graceDays > 0
                    ? `We've kept your workspace accessible for ${graceDays} ${plural} as a grace period.`
                    : ""}
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  To continue using {companyName} without interruption, please
                  upgrade to a paid plan.
                </Text>
              </Section>
              {upgradeLink && (
                <Container>
                  <Button
                    align="center"
                    backgroundColor="#000000"
                    fontSize={16}
                    height={48}
                    href={upgradeLink}
                    textColor="#ffffff"
                    width={220}
                  >
                    Upgrade now
                  </Button>
                </Container>
              )}
              {upgradeLink && (
                <Section className="my-6">
                  <Text className="text-gray-700 dark:text-gray-200">
                    Or copy and paste this URL into your browser:{" "}
                    <Link
                      className="text-black dark:text-white"
                      href={upgradeLink}
                    >
                      {upgradeLink}
                    </Link>
                  </Text>
                </Section>
              )}
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  If you need help choosing a plan or have any questions, just
                  reply to this email.
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

export const templateName = "trial-ended";
export const previewProps: TrialEndedEmailProps = {
  username: "there",
  upgradeLink: "https://example.com/upgrade",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
  graceDays: 3,
};
export const Template = (props: TrialEndedEmailProps) => (
  <TrialEndedEmail {...props} />
);
