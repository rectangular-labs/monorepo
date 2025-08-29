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
                  Your verification code
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi {username},
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  Use the following verification code to complete your sign-in:
                </Text>
              </Section>
              <Section className="my-8 bg-gray-50 px-6 py-6">
                <Container>
                  <Text className="font-bold font-mono text-3xl text-gray-900 tracking-widest">
                    {otp}
                  </Text>
                </Container>
              </Section>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  This code will expire in 10 minutes. If you didn't request
                  this code, you can safely ignore this email.
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">
                  Sent by {companyName}
                </Text>
              </Section>
            </Section>
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
