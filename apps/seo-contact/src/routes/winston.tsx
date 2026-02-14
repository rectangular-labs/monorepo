import { createFileRoute } from "@tanstack/react-router";
import { clientEnv } from "~/lib/env";
import { ContactProfile } from "./-components/contact-profile";

export const Route = createFileRoute("/winston")({
  component: WinstonPage,
});

function WinstonPage() {
  const env = clientEnv();

  return (
    <ContactProfile
      companyRole="Co-founder"
      email={env.VITE_WINSTON_EMAIL}
      name="Winston Yeo"
      phone={env.VITE_WINSTON_PHONE}
      websiteUrl={env.VITE_WWW_URL}
    />
  );
}
