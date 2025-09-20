import { defineStepper } from "@stepperize/react";

export const OnboardingSteps = defineStepper(
  {
    id: "welcome",
    title: "Welcome",
    description: "We'll set up your workspace in 4 quick steps (~3 minutes)",
  },
  {
    id: "user-background",
    title: "Background",
    description:
      "Help us better understand your background to personalize your onboarding experience.",
  },
  {
    id: "website-info",
    title: "Company",
    description:
      "We will visit your company's website to match your goals with what your company does.",
  },
  {
    id: "understanding-site",
    title: "Formulating Plan",
    description:
      "Hang tight while we synthesize everything! Note that this may take a few minutes.",
  },
  {
    id: "review-organization",
    title: "Review Organization",
    description:
      "Your organization will let you manage team members and projects.",
  },
  {
    id: "review-project",
    title: "Review Project",
    description: "Configure your first project.",
  },
  {
    id: "all-set",
    title: "You're all set!",
    description: "Let's get you to your dashboard.",
  },
);
