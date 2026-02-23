import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";

export const Route = createFileRoute("/_authed/admin")({
  beforeLoad: ({ context }) => {
    if (!context.user?.email?.endsWith("fluidposts.com")) {
      throw notFound();
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const api = getApiClientRq();
  const [projectSlug, setProjectSlug] = useState("");

  const { mutate: triggerOnboarding, isPending } = useMutation(
    api.admin.triggerOnboardingTask.mutationOptions({
      onSuccess: () => {
        toast.success("Triggered onboarding workflow successfully.");
        setProjectSlug("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const [instructions, setInstructions] = useState("");

  const { mutate: triggerStrategySuggestions, isPending: isPendingStrategy } =
    useMutation(
      api.admin.triggerStrategySuggestionsTask.mutationOptions({
        onSuccess: () => {
          toast.success(
            "Triggered strategy suggestions workflow successfully.",
          );
          setProjectSlug("");
          setInstructions("");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }),
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectSlug.trim()) {
      toast.error("Please enter a project slug");
      return;
    }
    triggerOnboarding({ projectSlug });
  };

  const handleStrategySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectSlug.trim()) {
      toast.error("Please enter a project slug");
      return;
    }
    triggerStrategySuggestions({
      projectSlug,
      instructions,
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center space-y-6 p-6">
      <div className="flex w-full max-w-md flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Internal tools for the fluidposts team.
        </p>
      </div>

      <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">
            Trigger Onboarding Task
          </h3>
          <p className="text-muted-foreground text-sm">
            Trigger the onboarding workflow in the api-seo package for a
            specific project.
          </p>
        </div>
        <div className="p-6 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="projectSlug">Project Slug</Label>
              <Input
                disabled={isPending}
                id="projectSlug"
                onChange={(e) => setProjectSlug(e.target.value)}
                placeholder="e.g. acme-corp"
                value={projectSlug}
              />
            </div>
            <Button
              disabled={!projectSlug.trim() || isPending}
              isLoading={isPending}
              type="submit"
            >
              Trigger Workflow
            </Button>
          </form>
        </div>
      </div>

      <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">
            Trigger Strategy Suggestions Task
          </h3>
          <p className="text-muted-foreground text-sm">
            Trigger the strategy suggestions workflow in the api-seo package for
            a specific project.
          </p>
        </div>
        <div className="p-6 pt-0">
          <form className="space-y-4" onSubmit={handleStrategySubmit}>
            <div className="space-y-2">
              <Label htmlFor="strategyProjectSlug">Project Slug</Label>
              <Input
                disabled={isPendingStrategy}
                id="strategyProjectSlug"
                onChange={(e) => setProjectSlug(e.target.value)}
                placeholder="e.g. acme-corp"
                value={projectSlug}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                disabled={isPendingStrategy}
                id="instructions"
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter instructions for strategy generation..."
                value={instructions}
              />
            </div>
            <Button
              disabled={!projectSlug.trim() || isPendingStrategy}
              isLoading={isPendingStrategy}
              type="submit"
            >
              Trigger Strategy Suggestions
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
