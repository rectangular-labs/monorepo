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
      email="aaron@fluidposts.com"
      name="Aaron Leong"
      phone="+65 96885688"
      websiteUrl={env.VITE_WWW_URL}
    />
  );
}
