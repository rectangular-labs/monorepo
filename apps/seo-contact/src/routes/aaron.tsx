import { createFileRoute } from "@tanstack/react-router";
import {
  fluidPostsCompanyLinkedIn,
  fluidPostsSocial,
} from "~/lib/contact-links";
import { clientEnv } from "~/lib/env";
import { ContactProfile } from "./-components/contact-profile";

const AARON_LINKEDIN = "https://www.linkedin.com/in/aaron-leong-64861b1a0/";

export const Route = createFileRoute("/aaron")({
  component: AaronPage,
});

function AaronPage() {
  const env = clientEnv();

  return (
    <ContactProfile
      companyLinkedInUrl={fluidPostsCompanyLinkedIn}
      companyRole="Co-founder"
      email={env.VITE_AARON_EMAIL}
      homeUrl={env.VITE_WWW_URL}
      linkedinUrl={AARON_LINKEDIN}
      name="Aaron Leong"
      phone={env.VITE_AARON_PHONE}
      socials={{
        instagram: fluidPostsSocial.instagram,
        facebook: fluidPostsSocial.facebook,
        tiktok: fluidPostsSocial.tiktok,
      }}
      websiteUrl={env.VITE_WWW_URL}
    />
  );
}
