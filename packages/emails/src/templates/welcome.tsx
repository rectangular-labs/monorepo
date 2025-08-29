import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "jsx-email";

export interface WelcomeEmailProps {
  username: string;
  dashboardLink?: string;
  companyName?: string;
  companyLogo?: string;
}

export const WelcomeEmail = ({
  username = "there",
  dashboardLink,
  companyName = "Our App",
  companyLogo,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {companyName}!</Preview>
      <Tailwind production>
        <Body className="font-sans">
          <Container className="mx-auto max-w-lg px-4 py-8 shadow-md">
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
                  Welcome to {companyName}!
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Welcome to {companyName}! We're excited to have you on board.
                  You're now part of our community and can start exploring all
                  the features we have to offer.
                </Text>
              </Section>
              {dashboardLink && (
                <Container>
                  <Button
                    align="center"
                    backgroundColor="#000000"
                    fontSize={16}
                    height={48}
                    href={dashboardLink}
                    textColor="#ffffff"
                    width={220}
                  >
                    Get started
                  </Button>
                </Container>
              )}
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  If you have any questions or need help getting started, don't
                  hesitate to reach out to our support team.
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Thanks for joining us, and welcome aboard!
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Best regards,
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

export const templateName = "welcome";
export const previewProps: WelcomeEmailProps = {
  username: "there",
  dashboardLink: "https://example.com/dashboard",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: WelcomeEmailProps) => (
  <WelcomeEmail {...props} />
);
