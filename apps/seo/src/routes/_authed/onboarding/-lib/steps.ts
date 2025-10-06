import { defineStepper } from "@stepperize/react";

const steps = [
  {
    id: "welcome",
    title: "Welcome",
    description: "We'll set up your workspace in 4 quick steps (~3 minutes)",
  },
  {
    id: "user-background",
    title: "Background",
    description: "Help us better personalize your onboarding experience.",
  },
  {
    id: "create-organization",
    title: "Create Organization",
    description:
      "Your organization will let you manage team members and projects.",
  },
  {
    id: "website-info",
    title: "Website Info",
    description:
      "We'll use your website's homepage to understand what your business does.",
  },
  {
    id: "understanding-site",
    title: "Understanding your site",
    description:
      "Hang tight while we synthesize everything! This typically takes 1 to 3 minutes.",
  },
  {
    id: "review-project",
    title: "Review Project",
    description: "Let's make sure everything looks good.",
  },
  {
    id: "all-set",
    title: "You're all set!",
    description:
      "Let's start running campaigns for your site on the dashboard.",
  },
] as const;
export const OnboardingSteps = defineStepper(...steps);
export type OnboardingStep = (typeof steps)[number]["id"];
