import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@rectangular-labs/ui/components/ui/tabs";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/articles/$contentId/",
)({
  component: PageComponent,
});

type Content = RouterOutputs["content"]["get"]["content"];

function PageComponent() {
  const { projectSlug, contentId, organizationSlug } = Route.useParams();

  // Fetch project data to check for active tasks
  const {
    data: project,
    isLoading: isLoadingProject,
    error: errorProject,
  } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const {
    data,
    isLoading: isLoadingContent,
    error: errorContent,
    refetch,
  } = useQuery(
    getApiClientRq().content.get.queryOptions({
      input: {
        projectId: project?.id ?? "",
        id: contentId,
      },
      enabled: !!project?.id,
    }),
  );

  const isLoading = isLoadingProject || isLoadingContent;
  const error = errorProject || errorContent;

  const hasRunningAnalysis = project?.tasks?.some(
    (task) => task.inputData.type === "analyze-keywords",
  );

  if (isLoading) {
    return (
      <div className="w-full space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-6 w-[600px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <LoadingError
          error={error}
          errorDescription="Failed to load content. Please try again."
          errorTitle="Error"
          isLoading={false}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!data?.content || !project) {
    if (hasRunningAnalysis) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center">
            <div className="h-12 w-12 animate-pulse rounded-full bg-primary" />
          </div>
          <h2 className="mb-2 font-semibold text-xl">Analyzing Site</h2>
          <p className="max-w-md text-center text-muted-foreground">
            We're still cataloging your site and analyzing keywords. This
            usually takes a few minutes.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-xl">No Content Found</h2>
          <p className="text-muted-foreground">
            This content could not be found.
          </p>
        </div>
      </div>
    );
  }

  return <ContentDetailView content={data.content} project={project} />;
}

function ContentDetailView({
  content,
  project,
}: {
  content: Content;
  project: NonNullable<RouterOutputs["project"]["get"]>;
}) {
  const { organizationSlug, projectSlug } = Route.useParams();
  const latestVersion = content.markdownVersions?.at(-1);
  const title = latestVersion?.title || content.pathname;

  // Calculate aggregated metrics from keywords
  const keywords = content.searchKeywordsMap || [];
  const avgKeywordDifficulty =
    keywords.length > 0
      ? Math.round(
          keywords.reduce(
            (sum, k) => sum + (k.searchKeyword.keywordDifficulty || 0),
            0,
          ) / keywords.length,
        )
      : 0;

  const avgRank =
    keywords.filter((k) => k.serpDetail?.current?.position).length > 0
      ? Math.round(
          keywords
            .filter((k) => k.serpDetail?.current?.position)
            .reduce(
              (sum, k) => sum + (k.serpDetail?.current?.position || 0),
              0,
            ) / keywords.filter((k) => k.serpDetail?.current?.position).length,
        )
      : null;

  const intentCounts = keywords.reduce(
    (acc, k) => {
      const intent = k.searchKeyword.intent;
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const majorityIntent = Object.entries(intentCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  return (
    <div className="w-full space-y-6 p-6">
      {/* Back button */}
      <Link
        className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
        params={{ organizationSlug, projectSlug }}
        to="/$organizationSlug/$projectSlug/articles"
      >
        <Icons.ArrowLeft className="h-4 w-4" />
        Back to Content
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <h1 className="font-bold text-3xl tracking-tight">{title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            {avgKeywordDifficulty > 0 && (
              <span>KD: {avgKeywordDifficulty}</span>
            )}
            {avgRank && <span>Avg Rank: {avgRank}</span>}
            {majorityIntent && <span>Intent: {majorityIntent}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="icon" variant="ghost">
            <a
              href={`${project.websiteUrl}${content.pathname}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icons.MoveUpRight className="h-4 w-4" />
            </a>
          </Button>
          <Button disabled>
            <Icons.Sparkles className="mr-2 h-4 w-4" />
            Optimize
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs className="w-full" defaultValue="keywords">
        <TabsList>
          <TabsTrigger value="keywords">
            <Icons.Target className="mr-2 h-4 w-4" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="content">
            <Icons.FileText className="mr-2 h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Icons.Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="keywords">
          <KeywordsTab keywords={content.searchKeywordsMap || []} />
        </TabsContent>

        <TabsContent className="mt-6" value="content">
          <ContentTab content={content} />
        </TabsContent>

        <TabsContent className="mt-6" value="settings">
          <SettingsTab content={content} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KeywordsTab({ keywords }: { keywords: Content["searchKeywordsMap"] }) {
  if (keywords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icons.Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-lg">No Keywords Yet</h3>
          <p className="text-muted-foreground">
            Keywords will appear here once analysis is complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium text-sm">Keyword</th>
                <th className="p-4 text-left font-medium text-sm">Type</th>
                <th className="p-4 text-right font-medium text-sm">
                  Search Vol.
                </th>
                <th className="p-4 text-right font-medium text-sm">CPC</th>
                <th className="p-4 text-right font-medium text-sm">KD</th>
                <th className="p-4 text-left font-medium text-sm">Intent</th>
                <th className="p-4 text-right font-medium text-sm">Rank</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr className="border-b last:border-0" key={kw.searchKeywordId}>
                  <td className="p-4 font-medium">
                    {kw.searchKeyword.normalizedPhrase}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={kw.type === "primary" ? "default" : "outline"}
                    >
                      {kw.type}
                    </Badge>
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    {kw.searchKeyword.searchVolume?.toLocaleString() || "—"}
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    $
                    {kw.searchKeyword.cpcUsdCents
                      ? (kw.searchKeyword.cpcUsdCents / 100).toFixed(2)
                      : "0.00"}
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    {kw.searchKeyword.keywordDifficulty || "—"}
                  </td>
                  <td className="p-4 capitalize">{kw.searchKeyword.intent}</td>
                  <td className="p-4 text-right tabular-nums">
                    {kw.serpDetail?.current?.position || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentTab({ content }: { content: Content }) {
  const { contentId } = Route.useParams();
  const queryClient = useQueryClient();
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<
    number | null
  >(null);
  const [editingContent, setEditingContent] = useState({
    title: "",
    description: "",
    markdown: "",
  });

  const versions = content.markdownVersions || [];
  const latestVersion = versions.at(-1);

  // Initialize editing content
  const currentVersion =
    selectedVersionIndex !== null
      ? versions[selectedVersionIndex]
      : latestVersion;

  const saveVersionMutation = useMutation(
    getApiClientRq().content.saveVersion.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getApiClientRq().content.get.queryKey({
            input: {
              projectId: content.projectId,
              id: contentId,
            },
          }),
        });
        setEditingContent({ title: "", description: "", markdown: "" });
        setSelectedVersionIndex(null);
      },
    }),
  );

  // Load selected version into editor
  const loadVersion = (index: number) => {
    const version = versions[index];
    if (version) {
      setSelectedVersionIndex(index);
      setEditingContent({
        title: version.title,
        description: version.description || "",
        markdown: version.markdown,
      });
    }
  };

  // Initialize with latest version if not editing
  if (
    currentVersion &&
    !editingContent.title &&
    selectedVersionIndex === null
  ) {
    setEditingContent({
      title: currentVersion.title,
      description: currentVersion.description || "",
      markdown: currentVersion.markdown,
    });
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icons.FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-lg">No Content Yet</h3>
          <p className="text-muted-foreground">
            Content will appear here once it's generated.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Editor</CardTitle>
              <Button
                disabled={saveVersionMutation.isPending}
                onClick={() =>
                  saveVersionMutation.mutate({
                    id: contentId,
                    projectId: content.projectId,
                    title: editingContent.title,
                    description: editingContent.description || undefined,
                    markdown: editingContent.markdown,
                  })
                }
                size="sm"
              >
                {saveVersionMutation.isPending ? (
                  <>
                    <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icons.Save className="mr-2 h-4 w-4" />
                    Save Version
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                className="mb-2 block font-medium text-sm"
                htmlFor="title-input"
              >
                Title
              </label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                id="title-input"
                onChange={(e) =>
                  setEditingContent((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Content title"
                value={editingContent.title}
              />
            </div>
            <div>
              <label
                className="mb-2 block font-medium text-sm"
                htmlFor="description-input"
              >
                Description (optional)
              </label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                id="description-input"
                onChange={(e) =>
                  setEditingContent((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description"
                value={editingContent.description}
              />
            </div>
            <div>
              <label
                className="mb-2 block font-medium text-sm"
                htmlFor="content-textarea"
              >
                Content
              </label>
              <Textarea
                className="min-h-[500px] font-mono text-sm"
                id="content-textarea"
                onChange={(e) =>
                  setEditingContent((prev) => ({
                    ...prev,
                    markdown: e.target.value,
                  }))
                }
                placeholder="Write your content in markdown..."
                value={editingContent.markdown}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Version History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {versions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No versions yet</p>
            ) : (
              versions
                .slice()
                .reverse()
                .map((version, idx) => {
                  const actualIndex = versions.length - 1 - idx;
                  const isSelected = selectedVersionIndex === actualIndex;
                  return (
                    <button
                      className={cn(
                        "w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/50",
                        isSelected && "border-primary bg-muted",
                      )}
                      key={actualIndex}
                      onClick={() => loadVersion(actualIndex)}
                      type="button"
                    >
                      <div className="mb-1 font-medium text-sm">
                        {version.title}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsTab({ content }: { content: Content }) {
  const { contentId } = Route.useParams();
  const queryClient = useQueryClient();
  const [selectedFormat, setSelectedFormat] = useState<string>(
    content.proposedFormat || "blog",
  );

  const updateFormatMutation = useMutation(
    getApiClientRq().content.updateFormat.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getApiClientRq().content.get.queryKey({
            input: {
              projectId: content.projectId,
              id: contentId,
            },
          }),
        });
      },
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label
            className="mb-2 block font-medium text-sm"
            htmlFor="format-select"
          >
            Content Format
          </label>
          <div className="flex items-center gap-4">
            <Select
              onValueChange={(value: string) => setSelectedFormat(value)}
              value={selectedFormat || undefined}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog">Blog Post</SelectItem>
                <SelectItem value="listicle">Listicle</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
                <SelectItem value="comparison">Comparison</SelectItem>
                <SelectItem value="how-to">How-To</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
                <SelectItem value="case-study">Case Study</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={
                updateFormatMutation.isPending ||
                selectedFormat === content.proposedFormat
              }
              onClick={() =>
                updateFormatMutation.mutate({
                  id: contentId,
                  projectId: content.projectId,
                  proposedFormat: selectedFormat as NonNullable<
                    Content["proposedFormat"]
                  >,
                })
              }
            >
              {updateFormatMutation.isPending ? (
                <>
                  <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">
            The format affects how the AI generates and structures the content.
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-medium text-sm">Content Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Campaign Type:</dt>
              <dd className="font-medium capitalize">
                {content.campaignType.replace("-", " ")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Category:</dt>
              <dd className="font-medium capitalize">
                {content.contentCategory.replace("-", " ")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status:</dt>
              <dd className="font-medium capitalize">{content.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pathname:</dt>
              <dd className="font-mono text-xs">{content.pathname}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
