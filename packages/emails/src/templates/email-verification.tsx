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
                Please verify your email
              </Heading>
            </Container>
            <Text className="my-6 text-gray-700">Hi {username},</Text>
            <Text className="my-6 text-gray-700">
              Thanks for signing up for {companyName}! To complete your
              registration, please verify your email address by clicking the
              button below:
            </Text>
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
            <Text className="my-6 text-gray-700">
              Or copy and paste this URL into your browser:{" "}
              <Link className="text-black" href={verificationLink}>
                {verificationLink}
              </Link>
            </Text>
            <Text className="my-6 text-gray-700">
              This verification link will expire in 24 hours. If you didn't
              create an account with {companyName}, you can safely ignore this
              email.
            </Text>
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
