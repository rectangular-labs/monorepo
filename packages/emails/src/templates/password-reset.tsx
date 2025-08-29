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

export interface PasswordResetEmailProps {
  username: string;
  resetLink: string;
  companyName?: string;
  companyLogo?: string;
}

export const PasswordResetEmail = ({
  username = "there",
  resetLink,
  companyName = "Our App",
  companyLogo,
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
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
                  Reset your password
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Someone recently requested a password change for your{" "}
                  {companyName} account. If this was you, you can set a new
                  password here:
                </Text>
              </Section>
              <Container>
                <Button
                  align="center"
                  backgroundColor="#000000"
                  fontSize={16}
                  height={48}
                  href={resetLink}
                  textColor="#ffffff"
                  width={220}
                >
                  Reset password
                </Button>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Or copy and paste this URL into your browser:{" "}
                  <Link className="text-black dark:text-white" href={resetLink}>
                    {resetLink}
                  </Link>
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  If you don't want to change your password or didn't request
                  this, just ignore and delete this message.
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  To keep your account secure, please don't forward this email
                  to anyone.
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">
                  This password reset link will expire in 1 hour.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const templateName = "password-reset";
export const previewProps: PasswordResetEmailProps = {
  username: "there",
  resetLink: "https://example.com/reset?token=123",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: PasswordResetEmailProps) => (
  <PasswordResetEmail {...props} />
);
