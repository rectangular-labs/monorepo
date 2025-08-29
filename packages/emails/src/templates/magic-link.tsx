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

export interface MagicLinkEmailProps {
  username: string;
  magicLink: string;
  companyName?: string;
  companyLogo?: string;
}

export const MagicLinkEmail = ({
  username = "there",
  magicLink,
  companyName = "Our App",
  companyLogo,
}: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your magic link to sign in</Preview>
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
                  Sign in to {companyName}
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Click the link below to sign in to your account. This link
                  will expire in 10 minutes.
                </Text>
              </Section>
              <Container>
                <Button
                  align="center"
                  backgroundColor="#000000"
                  fontSize={16}
                  height={48}
                  href={magicLink}
                  textColor="#ffffff"
                  width={220}
                >
                  Sign in
                </Button>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Or copy and paste this URL into your browser:{" "}
                  <Link className="text-black dark:text-white" href={magicLink}>
                    {magicLink}
                  </Link>
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">
                  If you didn't request this email, you can safely ignore it.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const templateName = "magic-link";
export const previewProps: MagicLinkEmailProps = {
  username: "there",
  magicLink: "https://example.com/magic?token=123",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: MagicLinkEmailProps) => (
  <MagicLinkEmail {...props} />
);
