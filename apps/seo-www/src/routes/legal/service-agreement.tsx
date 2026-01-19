import { createFileRoute } from "@tanstack/react-router";
import { seo } from "~/lib/seo";
import { LegalPageLayout } from "./-components/legal-page-layout";
import { SERVICE_AGREEMENT_CONTENT } from "./-content/service-agreement-content";

export const Route = createFileRoute("/legal/service-agreement")({
  component: ServiceAgreementPage,
  head: () => ({
    meta: [
      ...seo({
        title: "Master Subscription Agreement | Fluid Posts",
        description:
          "Fluid Posts Master Subscription Agreement outlining the terms and conditions for using our SEO software-as-a-service platform.",
      }),
    ],
  }),
});

function ServiceAgreementPage() {
  return (
    <LegalPageLayout
      content={SERVICE_AGREEMENT_CONTENT}
      contentId="service-agreement"
      subtitle="Last updated on January 18, 2025"
      title="Service Agreement"
    />
  );
}
