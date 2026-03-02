import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getApiClientRq } from "~/lib/api";

export const Route = createFileRoute("/_authed/admin/")({
  beforeLoad: ({ context }) => {
    if (!context.user?.email?.endsWith("fluidposts.com")) {
      throw notFound();
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const api = getApiClientRq();
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [instructions, setInstructions] = useState("");
  const [phaseStrategyName, setPhaseStrategyName] = useState("");
  const [evalType, setEvalType] = useState<"content" | "strategy">("content");
  const [selectedFixtureId, setSelectedFixtureId] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [generatedDurationMs, setGeneratedDurationMs] = useState(0);
  const [generatedFixtureId, setGeneratedFixtureId] = useState("");
  const [generatedType, setGeneratedType] = useState<"content" | "strategy">(
    "content",
  );
  const [generationJobId, setGenerationJobId] = useState("");
  const [lastGenerationHandledJobId, setLastGenerationHandledJobId] =
    useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const [generatedOutputFileName, setGeneratedOutputFileName] = useState("");
  const [generatedStepsJson, setGeneratedStepsJson] = useState("");
  const [generatedStepsFileName, setGeneratedStepsFileName] = useState("");
  const [scoreJson, setScoreJson] = useState("");
  const [scoreFileName, setScoreFileName] = useState("");
  const [scoreResult, setScoreResult] = useState<{
    overallScore: number;
    dimensions: { name: string; score: number; feedback: string }[];
  } | null>(null);

  const { data: fixturesData, isLoading: isFixturesLoading } = useQuery(
    api.admin.listEvalFixtures.queryOptions(),
  );
  const { data: generationStatus } = useQuery(
    api.admin.getEvalGenerationStatus.queryOptions({
      input: { jobId: generationJobId },
      enabled: !!generationJobId,
      refetchInterval: (context) => {
        const status = context.state.data?.status;
        if (status === "pending") {
          return 30_000;
        }
        return false;
      },
    }),
  );
  const { mutate: triggerOnboarding, isPending } = useMutation(
    api.admin.triggerOnboardingTask.mutationOptions({
      onSuccess: () => {
        toast.success("Triggered onboarding workflow successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const { mutate: triggerStrategySuggestions, isPending: isPendingStrategy } =
    useMutation(
      api.admin.triggerStrategySuggestionsTask.mutationOptions({
        onSuccess: () => {
          toast.success(
            "Triggered strategy suggestions workflow successfully.",
          );
          setInstructions("");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }),
    );

  const { mutate: generateEvalOutput, isPending: isPendingEvalGeneration } =
    useMutation(
      api.admin.generateEvalOutput.mutationOptions({
        onSuccess: (data) => {
          setGenerationJobId(data.jobId);
          setGeneratedOutput("");
          setGeneratedDurationMs(0);
          setGeneratedFixtureId(data.fixtureId);
          setGeneratedType(data.type);
          setGeneratedAt("");
          setGeneratedOutputFileName("");
          setGeneratedStepsJson("");
          setGeneratedStepsFileName("");
          setScoreJson("");
          setScoreFileName("");
          setScoreResult(null);
          toast.success(`Started ${data.type} fixture generation.`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }),
    );

  const { mutate: scoreEvalOutput, isPending: isPendingEvalScoring } =
    useMutation(
      api.admin.scoreEvalOutput.mutationOptions({
        onSuccess: (data) => {
          setScoreResult({
            overallScore: data.overallScore,
            dimensions: data.dimensions.map((dimension) => ({
              name: dimension.name,
              score: dimension.score,
              feedback: dimension.feedback,
            })),
          });
          setScoreJson(data.scoreJson);
          setScoreFileName(data.scoreFileName);
          toast.success(`Scored: ${data.overallScore}/10`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }),
    );

  const { mutate: triggerStrategyPhase, isPending: isPendingStrategyPhase } =
    useMutation(
      api.admin.triggerStrategyPhaseGenerationTask.mutationOptions({
        onSuccess: () => {
          toast.success(
            "Triggered strategy phase generation workflow successfully.",
          );
          setPhaseStrategyName("");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }),
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationSlug.trim()) {
      toast.error("Please enter an organization slug");
      return;
    }
    if (!projectSlug.trim()) {
      toast.error("Please enter a project slug");
      return;
    }
    triggerOnboarding({ organizationSlug, projectSlug });
  };

  const handleStrategySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationSlug.trim()) {
      toast.error("Please enter an organization slug");
      return;
    }
    if (!projectSlug.trim()) {
      toast.error("Please enter a project slug");
      return;
    }
    triggerStrategySuggestions({
      organizationSlug,
      projectSlug,
      instructions,
    });
  };

  const handleStrategyPhaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationSlug.trim()) {
      toast.error("Please enter an organization slug");
      return;
    }
    if (!projectSlug.trim()) {
      toast.error("Please enter a project slug");
      return;
    }
    if (!phaseStrategyName.trim()) {
      toast.error("Please enter a strategy name");
      return;
    }

    triggerStrategyPhase({
      organizationSlug,
      projectSlug,
      strategyName: phaseStrategyName,
    });
  };

  const fixtureOptions =
    evalType === "content"
      ? (fixturesData?.content ?? [])
      : (fixturesData?.strategy ?? []);
  const isGenerationPending = generationStatus?.status === "pending";

  useEffect(() => {
    if (!generationStatus || !generationJobId) {
      return;
    }
    if (generationStatus.jobId === lastGenerationHandledJobId) {
      return;
    }
    if (generationStatus.status === "completed") {
      setGeneratedOutput(generationStatus.output ?? "");
      setGeneratedDurationMs(generationStatus.durationMs ?? 0);
      setGeneratedFixtureId(generationStatus.fixtureId ?? "");
      if (generationStatus.type) {
        setGeneratedType(generationStatus.type);
      }
      setGeneratedAt(generationStatus.generatedAt ?? "");
      setGeneratedOutputFileName(generationStatus.outputFileName ?? "");
      setGeneratedStepsJson(generationStatus.stepsJson ?? "");
      setGeneratedStepsFileName(generationStatus.stepsFileName ?? "");
      setLastGenerationHandledJobId(generationStatus.jobId);
      toast.success(
        `Generated ${generationStatus.type} fixture output in ${generationStatus.durationMs ?? 0}ms.`,
      );
      return;
    }
    if (generationStatus.status === "failed") {
      setLastGenerationHandledJobId(generationStatus.jobId);
      toast.error(generationStatus.error ?? "Fixture generation failed");
      return;
    }
    if (generationStatus.status === "not_found") {
      setLastGenerationHandledJobId(generationStatus.jobId);
      toast.error("Fixture generation job expired or was not found.");
    }
  }, [generationStatus, generationJobId, lastGenerationHandledJobId]);

  const handleGenerateEvalOutput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixtureId.trim()) {
      toast.error("Please select a fixture");
      return;
    }
    generateEvalOutput({
      type: evalType,
      fixtureId: selectedFixtureId,
    });
  };

  const handleScoreEvalOutput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedOutput.trim()) {
      toast.error("No generated output to score");
      return;
    }
    if (!generatedFixtureId.trim()) {
      toast.error("No generated fixture selected");
      return;
    }

    scoreEvalOutput({
      type: generatedType,
      fixtureId: generatedFixtureId,
      output: generatedOutput,
      durationMs: generatedDurationMs,
    });
  };

  const downloadTextFile = ({
    content,
    fileName,
    contentType,
  }: {
    content: string;
    fileName: string;
    contentType: string;
  }) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center space-y-6 p-6">
      <div className="flex w-full max-w-md flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Internal tools for the fluidposts team.
        </p>
      </div>

      <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
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
              <Label htmlFor="organizationSlug">Organization Slug</Label>
              <Input
                disabled={isPending}
                id="organizationSlug"
                onChange={(e) => setOrganizationSlug(e.target.value)}
                placeholder="e.g. acme"
                value={organizationSlug}
              />
            </div>
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
              disabled={
                !organizationSlug.trim() || !projectSlug.trim() || isPending
              }
              isLoading={isPending}
              type="submit"
            >
              Trigger Workflow
            </Button>
          </form>
        </div>
      </div>

      <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
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
              <Label htmlFor="strategyOrganizationSlug">
                Organization Slug
              </Label>
              <Input
                disabled={isPendingStrategy}
                id="strategyOrganizationSlug"
                onChange={(e) => setOrganizationSlug(e.target.value)}
                placeholder="e.g. acme"
                value={organizationSlug}
              />
            </div>
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
              disabled={
                !organizationSlug.trim() ||
                !projectSlug.trim() ||
                isPendingStrategy
              }
              isLoading={isPendingStrategy}
              type="submit"
            >
              Trigger Strategy Suggestions
            </Button>
          </form>
        </div>
      </div>

      <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">
            Trigger Strategy Phase Generation
          </h3>
          <p className="text-muted-foreground text-sm">
            Trigger the strategy phase generation workflow in the api-seo
            package for a specific strategy.
          </p>
        </div>
        <div className="p-6 pt-0">
          <form className="space-y-4" onSubmit={handleStrategyPhaseSubmit}>
            <div className="space-y-2">
              <Label htmlFor="phaseOrganizationSlug">Organization Slug</Label>
              <Input
                disabled={isPendingStrategyPhase}
                id="phaseOrganizationSlug"
                onChange={(e) => setOrganizationSlug(e.target.value)}
                placeholder="e.g. rectangular-labs"
                value={organizationSlug}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phaseProjectSlug">Project Slug</Label>
              <Input
                disabled={isPendingStrategyPhase}
                id="phaseProjectSlug"
                onChange={(e) => setProjectSlug(e.target.value)}
                placeholder="e.g. acme-corp"
                value={projectSlug}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phaseStrategyName">Strategy Name</Label>
              <Input
                disabled={isPendingStrategyPhase}
                id="phaseStrategyName"
                onChange={(e) => setPhaseStrategyName(e.target.value)}
                placeholder="e.g. Topic Cluster For CRM ROI"
                value={phaseStrategyName}
              />
            </div>
            <Button
              disabled={
                !organizationSlug.trim() ||
                !projectSlug.trim() ||
                !phaseStrategyName.trim() ||
                isPendingStrategyPhase
              }
              isLoading={isPendingStrategyPhase}
              type="submit"
            >
              Trigger Strategy Phase Generation
            </Button>
          </form>
        </div>
      </div>

      <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">
            Eval Fixtures
          </h3>
          <p className="text-muted-foreground text-sm">
            Generate output from eval fixtures in the UI, then score that output
            separately.
          </p>
        </div>
        <div className="space-y-6 p-6 pt-0">
          <form className="space-y-4" onSubmit={handleGenerateEvalOutput}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="evalType">Fixture Type</Label>
                <Select
                  disabled={isPendingEvalGeneration}
                  onValueChange={(value: "content" | "strategy") => {
                    setEvalType(value);
                    setSelectedFixtureId("");
                    setGeneratedOutput("");
                    setGenerationJobId("");
                    setGeneratedAt("");
                    setGeneratedOutputFileName("");
                    setGeneratedStepsJson("");
                    setGeneratedStepsFileName("");
                    setScoreJson("");
                    setScoreFileName("");
                    setScoreResult(null);
                  }}
                  value={evalType}
                >
                  <SelectTrigger id="evalType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">content</SelectItem>
                    <SelectItem value="strategy">strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evalFixture">Fixture</Label>
                <Select
                  disabled={isPendingEvalGeneration || isFixturesLoading}
                  onValueChange={setSelectedFixtureId}
                  value={selectedFixtureId}
                >
                  <SelectTrigger id="evalFixture">
                    <SelectValue
                      placeholder={
                        isFixturesLoading
                          ? "Loading fixtures..."
                          : "Select fixture"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fixtureOptions.map((fixture) => (
                      <SelectItem key={fixture.id} value={fixture.id}>
                        {fixture.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFixtureId ? (
                  <p className="text-muted-foreground text-xs">
                    {
                      fixtureOptions.find(
                        (fixture) => fixture.id === selectedFixtureId,
                      )?.description
                    }
                  </p>
                ) : null}
              </div>
            </div>

            <Button
              disabled={
                !selectedFixtureId ||
                isPendingEvalGeneration ||
                isGenerationPending ||
                isFixturesLoading
              }
              isLoading={isPendingEvalGeneration}
              type="submit"
            >
              {isGenerationPending
                ? "Generating..."
                : "Generate Fixture Output"}
            </Button>
          </form>

          <form className="space-y-4" onSubmit={handleScoreEvalOutput}>
            <div className="space-y-2">
              <Label htmlFor="generatedOutput">Generated Output</Label>
              <Textarea
                className="min-h-[240px]"
                id="generatedOutput"
                onChange={(e) => setGeneratedOutput(e.target.value)}
                value={generatedOutput}
              />
              {generatedFixtureId ? (
                <p className="text-muted-foreground text-xs">
                  Generated from {generatedType}:{generatedFixtureId} in{" "}
                  {generatedDurationMs}ms
                </p>
              ) : null}
              {generationJobId ? (
                <p className="text-muted-foreground text-xs">
                  Generation job: {generationJobId} (
                  {generationStatus?.status ?? "pending"})
                </p>
              ) : null}
              {generatedAt ? (
                <p className="text-muted-foreground text-xs">
                  Generated at: {generatedAt}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!generatedOutput || !generatedOutputFileName}
                onClick={() =>
                  downloadTextFile({
                    content: generatedOutput,
                    fileName: generatedOutputFileName,
                    contentType: "text/markdown;charset=utf-8",
                  })
                }
                type="button"
                variant="outline"
              >
                Download Output (.md)
              </Button>
              <Button
                disabled={!generatedStepsJson || !generatedStepsFileName}
                onClick={() =>
                  downloadTextFile({
                    content: generatedStepsJson,
                    fileName: generatedStepsFileName,
                    contentType: "application/json;charset=utf-8",
                  })
                }
                type="button"
                variant="outline"
              >
                Download Steps (.json)
              </Button>
            </div>

            <Button
              disabled={
                !generatedOutput.trim() ||
                !generatedFixtureId ||
                isPendingEvalScoring
              }
              isLoading={isPendingEvalScoring}
              type="submit"
            >
              Score Generated Output
            </Button>
          </form>

          {scoreResult ? (
            <div className="space-y-2 rounded-md border p-4">
              <p className="font-medium">
                Overall score: {scoreResult.overallScore}/10
              </p>
              <Button
                disabled={!scoreJson || !scoreFileName}
                onClick={() =>
                  downloadTextFile({
                    content: scoreJson,
                    fileName: scoreFileName,
                    contentType: "application/json;charset=utf-8",
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                Download Score (.json)
              </Button>
              <div className="space-y-1">
                {scoreResult.dimensions.map((dimension) => (
                  <p className="text-sm" key={dimension.name}>
                    <span className="font-medium">{dimension.name}</span>:{" "}
                    {dimension.score}/10 - {dimension.feedback}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
