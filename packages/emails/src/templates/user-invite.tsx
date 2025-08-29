import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
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
                You've been invited to {teamName}
              </Heading>
            </Container>
            <Text className="my-6 text-gray-700">Hi there,</Text>
            <Text className="my-6 text-gray-700">
              <strong>{inviterName}</strong> has invited you to join{" "}
              <strong>{teamName}</strong> on {companyName}.
            </Text>
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
            <Text className="my-6 text-gray-700">
              This invitation was sent to <strong>{inviteeEmail}</strong>. If
              you were not expecting this invitation, you can ignore this email.
            </Text>
            <Text className="my-6 text-gray-700">
              If you already have an account with {companyName}, clicking the
              button above will add you to the team. If you don't have an
              account, you'll be able to create one.
            </Text>
            <Text className="my-6 text-gray-500">
              This invitation will expire in 7 days.
            </Text>
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
