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
  resetLink?: string;
  otpCode?: string;
  expiresIn?:
    | `${number} minutes`
    | `${number} minute`
    | `${number} hour`
    | `${number} hours`
    | `${number} day`
    | `${number} days`;
  companyName?: string;
  companyLogo?: string;
}

export const PasswordResetEmail = ({
  username = "there",
  resetLink,
  otpCode,
  expiresIn = "1 hour",
  companyName = "Our App",
  companyLogo,
}: PasswordResetEmailProps) => {
  const isOtp = Boolean(otpCode && otpCode.trim().length > 0);
  return (
    <Html>
      <Head />
      <Preview>
        {isOtp
          ? `Code ${otpCode} to reset your password will expire in ${expiresIn}`
          : `Link to reset your password will expire in ${expiresIn}`}
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
                  Reset your password
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                {isOtp ? (
                  <Text className="text-gray-700 dark:text-gray-200">
                    Someone recently requested a password change for your{" "}
                    {companyName} account. Use the one-time code below to
                    continue. This code will expire in {expiresIn}.
                  </Text>
                ) : (
                  <Text className="text-gray-700 dark:text-gray-200">
                    Someone recently requested a password change for your{" "}
                    {companyName} account. If this was you, you can set a new
                    password here. This password reset link will expire in{" "}
                    {expiresIn}.
                  </Text>
                )}
              </Section>
              {isOtp ? (
                <Section className="my-6">
                  <Container className="my-4 rounded-md bg-black px-4 py-3 dark:bg-white">
                    <Text className="text-center font-mono text-2xl text-white tracking-widest dark:text-black">
                      {otpCode}
                    </Text>
                  </Container>
                  <Text className="text-gray-700 dark:text-gray-200">
                    If you didn't request this, you can safely ignore this
                    email.
                  </Text>
                </Section>
              ) : (
                <>
                  {resetLink && (
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
                  )}
                  {resetLink && (
                    <Section className="my-6">
                      <Text className="text-gray-700 dark:text-gray-200">
                        Or copy and paste this URL into your browser:{" "}
                        <Link
                          className="text-black dark:text-white"
                          href={resetLink}
                        >
                          {resetLink}
                        </Link>
                      </Text>
                      <Text className="text-gray-700 dark:text-gray-200">
                        If you don't want to change your password or didn't
                        request this, just ignore and delete this message.
                      </Text>
                      <Text className="text-gray-700 dark:text-gray-200">
                        To keep your account secure, please don't forward this
                        email to anyone.
                      </Text>
                    </Section>
                  )}
                </>
              )}
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
  otpCode: "123456",
  expiresIn: "1 hour",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: PasswordResetEmailProps) => (
  <PasswordResetEmail {...props} />
);
