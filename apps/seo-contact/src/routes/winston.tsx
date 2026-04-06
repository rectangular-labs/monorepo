import { createFileRoute } from "@tanstack/react-router";
import {
  fluidPostsCompanyLinkedIn,
  fluidPostsSocial,
} from "~/lib/contact-links";
import { clientEnv } from "~/lib/env";
import { ContactProfile } from "./-components/contact-profile";

const WINSTON_LINKEDIN = "https://www.linkedin.com/in/winston-yeo/";

export const Route = createFileRoute("/winston")({
  component: WinstonPage,
});

function WinstonPage() {
  const env = clientEnv();

  return (
    <ContactProfile
      companyLinkedInUrl={fluidPostsCompanyLinkedIn}
      companyRole="Co-founder"
      email={env.VITE_WINSTON_EMAIL}
      homeUrl={env.VITE_WWW_URL}
      linkedinUrl={WINSTON_LINKEDIN}
      name="Winston Yeo"
      phone={env.VITE_WINSTON_PHONE}
      socials={{
        instagram: fluidPostsSocial.instagram,
        youtube: fluidPostsSocial.youtube,
        facebook: fluidPostsSocial.facebook,
        tiktok: fluidPostsSocial.tiktok,
      }}
      websiteUrl={env.VITE_WWW_URL}
    />
  );
}
