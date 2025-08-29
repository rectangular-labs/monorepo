import {
  Body,
  Button,
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

export interface UserInviteEmailProps {
  inviterName: string;
  inviteeEmail: string;
  teamName: string;
  inviteLink: string;
  companyName?: string;
  companyLogo?: string;
}

export const UserInviteEmail = ({
  inviterName,
  inviteeEmail,
  teamName,
  inviteLink,
  companyName = "Our App",
  companyLogo,
}: UserInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {teamName}</Preview>
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
                  You've been invited to {teamName}
                </Heading>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  Hi there,
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  <strong>{inviterName}</strong> has invited you to join{" "}
                  <strong>{teamName}</strong> on {companyName}.
                </Text>
              </Section>
              <Container>
                <Button
                  align="center"
                  backgroundColor="#000000"
                  fontSize={16}
                  height={48}
                  href={inviteLink}
                  textColor="#ffffff"
                  width={220}
                >
                  Accept invitation
                </Button>
              </Container>
              <Section className="my-6">
                <Text className="text-gray-700 dark:text-gray-200">
                  This invitation was sent to <strong>{inviteeEmail}</strong>.
                  If you were not expecting this invitation, you can ignore this
                  email.
                </Text>
                <Text className="text-gray-700 dark:text-gray-200">
                  If you already have an account with {companyName}, clicking
                  the button above will add you to the team. If you don't have
                  an account, you'll be able to create one.
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">
                  This invitation will expire in 7 days.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const templateName = "user-invite";
export const previewProps: UserInviteEmailProps = {
  inviterName: "Alice",
  inviteeEmail: "invitee@example.com",
  teamName: "Example Team",
  inviteLink: "https://example.com/invite?token=123",
  companyName: "Our App",
  companyLogo: "https://placehold.co/40x40",
};
export const Template = (props: UserInviteEmailProps) => (
  <UserInviteEmail {...props} />
);
