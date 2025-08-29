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
                Reset your password
              </Heading>
            </Container>
            <Text className="my-6 text-gray-700">Hi {username},</Text>
            <Text className="my-6 text-gray-700">
              Someone recently requested a password change for your{" "}
              {companyName} account. If this was you, you can set a new password
              here:
            </Text>
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
            <Text className="my-6 text-gray-700">
              Or copy and paste this URL into your browser:{" "}
              <Link className="text-black" href={resetLink}>
                {resetLink}
              </Link>
            </Text>
            <Text className="my-6 text-gray-700">
              If you don't want to change your password or didn't request this,
              just ignore and delete this message.
            </Text>
            <Text className="my-6 text-gray-700">
              To keep your account secure, please don't forward this email to
              anyone.
            </Text>
            <Text className="my-6 text-gray-500">
              This password reset link will expire in 1 hour.
            </Text>
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
