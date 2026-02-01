import { defineStepper } from "@stepperize/react";

const steps = [
  {
    id: "welcome",
    title: "Welcome",
    description: "We'll set up your workspace in 4 quick steps (~4 minutes)",
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
    id: "connect-gsc",
    title: "Connect Search Console",
    description:
      "Link your Google Search Console account to enable more accurate data.",
  },
  {
    id: "connect-gsc-property",
    title: "Select Property",
    description:
      "Choose which Google Search Console property to connect to your project.",
  },
  {
    id: "connect-publishing",
    title: "Connect Publishing",
    description: "Connect a destination to publish your content.",
  },
  {
    id: "strategy-insights",
    title: "Strategy Insights",
    description: "We generated a few strategy suggestions based on your site.",
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
