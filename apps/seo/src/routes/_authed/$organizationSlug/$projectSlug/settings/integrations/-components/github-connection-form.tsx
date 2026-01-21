import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { GitHubIcon } from "@rectangular-labs/ui/components/icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rectangular-labs/ui/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import {
  arktypeResolver,
  Controller,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Switch } from "@rectangular-labs/ui/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useCallback, useEffect, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { authClient } from "~/lib/auth";

type IntegrationSummary =
  RouterOutputs["integrations"]["list"]["integrations"][number];

interface GithubConnectionFormProps {
  projectId: string;
  organizationSlug: string;
  existingIntegration?: IntegrationSummary;
  onClose: () => void;
  inline?: boolean;
  hasIntegrations?: boolean;
}

const formSchema = type({
  repository: type("string").atLeastLength(1),
  branch: type("string").atLeastLength(1),
  basePath: type("string").atLeastLength(1),
  mode: "'commit' | 'pull_request'",
  isDefault: "boolean",
  "frontmatterMapping?": type({
    "title?": "string",
    "description?": "string",
    "slug?": "string",
    "primaryKeyword?": "string",
    "date?": "string",
    "image?": "string",
    "imageCaption?": "string",
    "keywords?": "string",
    "articleType?": "string",
  }),
});

type FormValues = typeof formSchema.infer;

export function GithubConnectionForm({
  projectId,
  organizationSlug,
  existingIntegration,
  onClose,
  inline = false,
  hasIntegrations = false,
}: GithubConnectionFormProps) {
  const queryClient = useQueryClient();
  const api = getApiClientRq();

  const existingConfig =
    existingIntegration?.config &&
    existingIntegration.config.provider === "github"
      ? existingIntegration.config
      : null;

  const frontmatterMappingDefaults = {
    title: "",
    description: "",
    slug: "",
    primaryKeyword: "",
    date: "",
    image: "",
    imageCaption: "",
    keywords: "",
    articleType: "",
  };

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  // Fetch repositories - always refetch on mount to pick up newly connected accounts
  const {
    data: reposData,
    isLoading: reposLoading,
    error: reposError,
    refetch: refetchRepos,
  } = useQuery(
    api.integrations.github.listRepositories.queryOptions({
      refetchOnMount: "always",
    }),
  );

  // Fetch branches when repository is selected
  const form = useForm<FormValues>({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      repository: existingConfig?.repository ?? "",
      branch: existingConfig?.branch ?? "",
      basePath: existingConfig?.basePath ?? "",
      mode: existingConfig?.mode ?? "commit",
      isDefault: existingIntegration?.isDefault ?? !hasIntegrations,
      frontmatterMapping: {
        ...frontmatterMappingDefaults,
        ...existingConfig?.frontmatterMapping,
      },
    },
  });

  const selectedRepo = form.watch("repository");

  const { data: branchesData, isLoading: branchesLoading } = useQuery(
    api.integrations.github.listBranches.queryOptions({
      input: {
        accountId: selectedAccountId ?? "",
        repository: selectedRepo,
      },
      enabled: !!selectedAccountId && !!selectedRepo,
    }),
  );

  // When repository changes, auto-select default branch and account ID
  useEffect(() => {
    if (selectedRepo && reposData?.repositories) {
      const repo = reposData.repositories.find(
        (r) => r.fullName === selectedRepo,
      );
      if (repo) {
        setSelectedAccountId(repo.accountId);
        const currentBranch = form.getValues("branch");
        const shouldUseDefault =
          !currentBranch || selectedRepo !== existingConfig?.repository;
        if (shouldUseDefault) {
          form.setValue("branch", repo.defaultBranch);
        }
      }
    }
  }, [selectedRepo, reposData, form, existingConfig?.repository]);

  useEffect(() => {
    if (!reposData?.repositories?.length || !existingConfig?.repository) return;
    const repo = reposData.repositories.find(
      (item) => item.fullName === existingConfig.repository,
    );
    if (repo) {
      setSelectedAccountId(repo.accountId);
    }
  }, [reposData, existingConfig?.repository]);

  // Create integration
  const { mutate: createIntegration, isPending: isCreating } = useMutation(
    api.integrations.create.mutationOptions({
      onSuccess: () => {
        toast.success("GitHub integration connected!");
        void queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: { organizationIdentifier: organizationSlug, projectId },
          }),
        });
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to connect: ${error.message}`);
      },
    }),
  );

  // Update integration
  const { mutate: updateIntegration, isPending: isUpdating } = useMutation(
    api.integrations.update.mutationOptions({
      onSuccess: () => {
        toast.success("GitHub integration updated!");
        void queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: { organizationIdentifier: organizationSlug, projectId },
          }),
        });
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to update: ${error.message}`);
      },
    }),
  );

  // Remove integration
  const { mutate: removeIntegration, isPending: isRemoving } = useMutation(
    api.integrations.remove.mutationOptions({
      onSuccess: () => {
        toast.success("GitHub integration disconnected!");
        void queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: { organizationIdentifier: organizationSlug, projectId },
          }),
        });
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to disconnect: ${error.message}`);
      },
    }),
  );

  const handleLinkGitHub = useCallback(() => {
    // Build callback URL with provider query param so the modal reopens after OAuth
    const url = new URL(window.location.href);
    url.searchParams.set("provider", "github");
    void authClient.linkSocial({
      provider: "github",
      callbackURL: url.toString(),
      scopes: ["repo", "read:org"],
    });
  }, []);

  const handleSubmit = (values: FormValues) => {
    if (!selectedAccountId) {
      toast.error("Please select a repository first.");
      return;
    }

    const frontmatterMapping = Object.fromEntries(
      Object.entries(values.frontmatterMapping ?? {}).filter(
        ([, value]) => typeof value === "string" && value.trim().length > 0,
      ),
    );

    const config = {
      provider: "github" as const,
      repository: values.repository,
      branch: values.branch,
      basePath: values.basePath,
      mode: values.mode,
      frontmatterMapping:
        Object.keys(frontmatterMapping).length > 0
          ? frontmatterMapping
          : undefined,
    };

    if (existingIntegration) {
      updateIntegration({
        id: existingIntegration.id,
        projectId,
        organizationIdentifier: organizationSlug,
        accountId: selectedAccountId,
        name: values.repository,
        isDefault: values.isDefault,
        config,
      });
    } else {
      createIntegration({
        projectId,
        organizationIdentifier: organizationSlug,
        accountId: selectedAccountId,
        name: values.repository,
        isDefault: values.isDefault,
        config,
      });
    }
  };

  const handleDisconnect = () => {
    if (!existingIntegration) return;
    removeIntegration({
      id: existingIntegration.id,
      projectId,
      organizationIdentifier: organizationSlug,
    });
  };

  const isPending = isCreating || isUpdating || isRemoving;

  // Show empty state if no GitHub account or no repo scopes
  if (!reposLoading && reposData && !reposData.hasGithubAccount) {
    return (
      <Empty className={inline ? "border-0 p-4" : ""}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GitHubIcon />
          </EmptyMedia>
          <EmptyTitle>Connect Your GitHub Account</EmptyTitle>
          <EmptyDescription>
            Link your GitHub account to push articles directly to your
            repository.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleLinkGitHub}>
            <GitHubIcon className="mr-2 size-4" />
            Connect GitHub
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (!reposLoading && reposData && !reposData.hasRepoScopes) {
    return (
      <Empty className={inline ? "border-0 p-4" : ""}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GitHubIcon />
          </EmptyMedia>
          <EmptyTitle>Grant Repository Access</EmptyTitle>
          <EmptyDescription>
            Your GitHub account is connected, but we need additional permissions
            to push content to your repositories. Click below to grant
            repository access.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleLinkGitHub}>
            <GitHubIcon className="mr-2 size-4" />
            Grant Repository Access
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (reposLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground text-sm">
          Loading repositories...
        </div>
      </div>
    );
  }

  if (reposError) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-destructive">Failed to load repositories</p>
        <Button onClick={() => refetchRepos()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const repositories = reposData?.repositories ?? [];

  return (
    <form
      className="max-h-[65vh] space-y-4 overflow-y-auto"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      {existingIntegration?.lastError && (
        <Alert variant="destructive">
          <AlertTitle>Last publish error</AlertTitle>
          <AlertDescription>{existingIntegration.lastError}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Controller
          control={form.control}
          name="repository"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Repository</FieldLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.fullName} value={repo.fullName}>
                      {repo.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="branch"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Branch</FieldLabel>
              <Select
                defaultValue={field.value}
                disabled={!selectedRepo || branchesLoading}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      branchesLoading
                        ? "Loading branches..."
                        : "Select a branch"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {branchesData?.branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="basePath"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Content Path</FieldLabel>
              <FieldDescription>
                Directory path where articles will be saved (e.g., /src/blog/)
              </FieldDescription>
              <Input placeholder="/src/blog/" {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="mode"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Publishing Mode</FieldLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commit">Direct Commit</SelectItem>
                  <SelectItem value="pull_request">Pull Request</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Accordion collapsible type="single">
          <AccordionItem value="frontmatter-mapping">
            <AccordionTrigger>Advanced frontmatter mapping</AccordionTrigger>
            <AccordionContent>
              <FieldGroup>
                {(
                  [
                    ["title", "Title"],
                    ["description", "Description"],
                    ["slug", "Slug"],
                    ["primaryKeyword", "Primary Keyword"],
                    ["date", "Date"],
                    ["image", "Image URL"],
                    ["imageCaption", "Image Caption"],
                    ["keywords", "Keywords"],
                    ["articleType", "Article Type"],
                  ] as const
                ).map(([key, label]) => (
                  <Controller
                    control={form.control}
                    key={key}
                    name={`frontmatterMapping.${key}`}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{label}</FieldLabel>
                        <FieldDescription>
                          Override the frontmatter key for {label.toLowerCase()}
                          .
                        </FieldDescription>
                        <Input placeholder={label.toLowerCase()} {...field} />
                      </Field>
                    )}
                  />
                ))}
              </FieldGroup>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Controller
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <Field
              className="items-center justify-between rounded-lg border p-4"
              orientation="horizontal"
            >
              <div className="space-y-0.5">
                <FieldLabel>Default Publishing Destination</FieldLabel>
                <FieldDescription>
                  {existingIntegration?.isDefault
                    ? "This integration is currently the default destination."
                    : "Set as the default destination when publishing articles."}
                </FieldDescription>
                {field.value &&
                  existingIntegration &&
                  !existingIntegration.isDefault && (
                    <p className="text-warning text-xs">
                      ⚠️ Enabling this will remove the default status from other
                      integrations. All articles in review will publish to this
                      destination.
                    </p>
                  )}
              </div>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </Field>
          )}
        />
      </FieldGroup>

      <Separator />

      <div className="flex items-center justify-between">
        {existingIntegration ? (
          <Button
            disabled={isPending}
            onClick={handleDisconnect}
            type="button"
            variant="destructive"
          >
            Disconnect
          </Button>
        ) : (
          <div />
        )}
        <Button
          disabled={isPending || !form.formState.isValid}
          isLoading={isCreating || isUpdating}
          type="submit"
        >
          {existingIntegration ? "Update" : "Connect"}
        </Button>
      </div>
    </form>
  );
}
