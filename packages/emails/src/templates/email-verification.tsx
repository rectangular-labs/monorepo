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

export interface EmailVerificationProps {
  username: string;
  verificationLink: string;
  companyName?: string;
  companyLogo?: string;
}

export const EmailVerificationEmail = ({
  username = "there",
  verificationLink,
  companyName = "Our App",
  companyLogo,
}: EmailVerificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Please verify your email address</Preview>
      <Tailwind production>
        <Body className="font-sans">
          <Container className="mx-auto max-w-lg border border-black px-4 py-8 shadow-md">
            {companyLogo && (
              <Img
                alt={companyName}
                className="rounded-lg"
                height="40"
                src={companyLogo}
                width="40"
              />
            )}
            <Section className="p-6">
              <Container>
                <Heading className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                  Please verify your email
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Thanks for signing up for {companyName}! To complete your
                  registration, please verify your email address by clicking the
                  button below:
                </Text>
              </Section>
              <Container>
                <Button
                  align="center"
                  backgroundColor="#000000"
                  fontSize={16}
                  height={48}
                  href={verificationLink}
                  textColor="#ffffff"
                  width={220}
                >
                  Verify email address
                </Button>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Or copy and paste this URL into your browser:{" "}
                  <Link
                    className="text-black dark:text-white"
                    href={verificationLink}
                  >
                    {verificationLink}
                  </Link>
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  This verification link will expire in 24 hours. If you didn't
                  create an account with {companyName}, you can safely ignore
                  this email.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const templateName = "email-verification";
export const previewProps: EmailVerificationProps = {
  username: "there",
  verificationLink: "https://example.com/verify?token=123",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: EmailVerificationProps) => (
  <EmailVerificationEmail {...props} />
);
