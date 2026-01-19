import { createFileRoute } from "@tanstack/react-router";
import { seo } from "~/lib/seo";
import { LegalPageLayout } from "./-components/legal-page-layout";
import { DATA_PROCESSING_AGREEMENT_CONTENT } from "./-content/data-processing-agreement-content";

export const Route = createFileRoute("/legal/data-processing-agreement")({
  component: DataProcessingAgreementPage,
  head: () => ({
    meta: [
      ...seo({
        title: "Data Processing Agreement | Fluid Posts",
        description:
          "Fluid Posts Data Processing Agreement (DPA) outlining how we process personal data on behalf of our customers in compliance with GDPR, PDPA, and other data protection laws.",
      }),
    ],
  }),
});

function DataProcessingAgreementPage() {
  return (
    <LegalPageLayout
      content={DATA_PROCESSING_AGREEMENT_CONTENT}
      contentId="dpa"
      subtitle="Last updated on January 18, 2026"
      title="Data Processing Agreement"
    />
  );
}
