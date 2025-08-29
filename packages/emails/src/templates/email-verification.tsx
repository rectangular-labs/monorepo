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
  verificationLink?: string;
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

export const EmailVerificationEmail = ({
  username = "there",
  verificationLink,
  otpCode,
  expiresIn = "24 hours",
  companyName = "Our App",
  companyLogo,
}: EmailVerificationProps) => {
  const isOtp = Boolean(otpCode && otpCode.trim().length > 0);
  return (
    <Html>
      <Head />
      <Preview>
        {isOtp
          ? `Code ${otpCode} to verify your email will expire in ${expiresIn}`
          : `Link to verify your email will expire in ${expiresIn}`}
      </Preview>
      <Tailwind production>
        <Body className="font-sans">
          <Container className="mx-auto max-w-lg px-2 py-8 shadow-md md:px-4 dark:border dark:border-gray-200 dark:border-solid dark:shadow-none">
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
                {isOtp ? (
                  <Text className="text-gray-700 dark:text-gray-200">
                    Thanks for signing up for {companyName}! To complete your
                    registration, please verify your email using the one-time
                    code below. This code will expire in {expiresIn}.
                  </Text>
                ) : (
                  <Text className="text-gray-700 dark:text-gray-200">
                    Thanks for signing up for {companyName}! To complete your
                    registration, please verify your email address by clicking
                    the button below. This verification link will expire in{" "}
                    {expiresIn}.
                  </Text>
                )}
              </Section>
              {isOtp ? (
                <>
                  <Container className="rounded-md bg-black px-4 py-3 dark:bg-white">
                    <Text className="text-center font-mono text-2xl text-white tracking-widest dark:text-black">
                      {otpCode}
                    </Text>
                  </Container>
                  <Text className="text-gray-700 dark:text-gray-200">
                    If you didn't request this, you can safely ignore this
                    email.
                  </Text>
                </>
              ) : (
                <>
                  {verificationLink && (
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
                  )}
                  {verificationLink && (
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
                        If you didn't create an account with {companyName}, you
                        can safely ignore this email.
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

export const templateName = "email-verification";
export const previewProps: EmailVerificationProps = {
  username: "there",
  verificationLink: "https://example.com/verify?token=123",
  // otpCode: "123456",
  expiresIn: "24 hours",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: EmailVerificationProps) => (
  <EmailVerificationEmail {...props} />
);
