import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
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
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-lg px-4 py-8">
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
            <Container>
              <Heading className="my-10 font-bold text-2xl text-gray-900">
                Welcome to {companyName}!
              </Heading>
            </Container>
            <Text className="my-6 text-gray-700">Hi {username},</Text>
            <Text className="my-6 text-gray-700">
              Welcome to {companyName}! We're excited to have you on board.
              You're now part of our community and can start exploring all the
              features we have to offer.
            </Text>
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
            <Text className="my-6 text-gray-700">
              If you have any questions or need help getting started, don't
              hesitate to reach out to our support team.
            </Text>
            <Text className="my-6 text-gray-700">
              Thanks for joining us, and welcome aboard!
            </Text>
            <Text className="my-6 text-gray-700">
              Best regards,
              <br />
              The {companyName} Team
            </Text>
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
