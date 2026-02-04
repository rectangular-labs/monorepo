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
      email="winston@fluidposts.com"
      name="Winston Yeo"
      phone="+1 4159888824"
      websiteUrl={env.VITE_WWW_URL}
    />
  );
}
