import { createFileRoute } from "@tanstack/react-router";
import { seo } from "~/lib/seo";
import { LegalPageLayout } from "./-components/legal-page-layout";
import { PRIVACY_POLICY_CONTENT } from "./-content/privacy-policy-content";

export const Route = createFileRoute("/legal/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      ...seo({
        title: "Privacy Policy | Fluid Posts",
        description:
          "Fluid Posts Privacy Policy describing how we collect, use, and disclose personal information when you use our services.",
      }),
    ],
  }),
});

function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      content={PRIVACY_POLICY_CONTENT}
      contentId="privacy-policy"
      subtitle="Last updated on January 18, 2025"
      title="Privacy Policy"
    />
  );
}
