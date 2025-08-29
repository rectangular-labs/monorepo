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
                Sign in to {companyName}
              </Heading>
            </Container>
            <Text className="my-6 text-gray-700">Hi {username},</Text>
            <Text className="my-6 text-gray-700">
              Click the link below to sign in to your account. This link will
              expire in 10 minutes.
            </Text>
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
            <Text className="my-6 text-gray-700">
              Or copy and paste this URL into your browser:{" "}
              <Link className="text-black" href={magicLink}>
                {magicLink}
              </Link>
            </Text>
            <Text className="my-6 text-gray-500">
              If you didn't request this email, you can safely ignore it.
            </Text>
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
