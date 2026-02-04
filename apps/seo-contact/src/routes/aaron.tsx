import { createFileRoute } from "@tanstack/react-router";
import { clientEnv } from "~/lib/env";
import { ContactProfile } from "./-components/contact-profile";

export const Route = createFileRoute("/aaron")({
  component: AaronPage,
});

function AaronPage() {
  const env = clientEnv();

  return (
    <ContactProfile
      companyRole="Co-founder"
      email={env.VITE_AARON_EMAIL}
      name="Aaron Leong"
      phone={env.VITE_AARON_PHONE}
      websiteUrl={env.VITE_WWW_URL}
    />
  );
}
