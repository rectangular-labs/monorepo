import {
  Body,
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

export interface OtpEmailProps {
  username: string;
  otp: string;
  companyName?: string;
  companyLogo?: string;
}

export const OtpEmail = ({
  username = "there",
  otp,
  companyName = "Our App",
  companyLogo,
}: OtpEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your verification code: {otp}</Preview>
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
                Your verification code
              </Heading>
            </Container>
            <Text className="my-6 text-gray-700">Hi {username},</Text>
            <Text className="my-6 text-gray-700">
              Use the following verification code to complete your sign-in:
            </Text>
            <Section className="my-8 bg-gray-50 px-6 py-6">
              <Container>
                <Text className="font-bold font-mono text-3xl text-gray-900 tracking-widest">
                  {otp}
                </Text>
              </Container>
            </Section>
            <Text className="my-6 text-gray-700">
              This code will expire in 10 minutes. If you didn't request this
              code, you can safely ignore this email.
            </Text>
            <Text className="my-6 text-gray-500">Sent by {companyName}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const templateName = "otp";
export const previewProps: OtpEmailProps = {
  username: "there",
  otp: "123456",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: OtpEmailProps) => <OtpEmail {...props} />;
