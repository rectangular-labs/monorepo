import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { ShoppingBag } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
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
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";

type IntegrationSummary =
  RouterOutputs["integrations"]["list"]["integrations"][number];

interface ShopifyConnectionFormProps {
  projectId: string;
  organizationSlug: string;
  existingIntegration?: IntegrationSummary;
  onClose: () => void;
}

const initiateFormSchema = type({
  name: "string",
  shopDomain: "string",
  adminUrl: "string",
  clientId: "string",
  clientSecret: "string",
  isDefault: "boolean",
});

const blogSelectFormSchema = type({
  blogId: "string",
  publishAsHtml: "boolean",
  isDefault: "boolean",
});

type InitiateFormValues = typeof initiateFormSchema.infer;
type BlogSelectFormValues = typeof blogSelectFormSchema.infer;

export function ShopifyConnectionForm({
  projectId,
  organizationSlug,
  existingIntegration,
  onClose,
}: ShopifyConnectionFormProps) {
  const queryClient = useQueryClient();
  const api = getApiClientRq();

  // Step management: "initiate" -> "select-blog" (after OAuth)
  const [step] = useState<"initiate" | "select-blog">(
    existingIntegration?.status === "pending_setup"
      ? "select-blog"
      : "initiate",
  );
  const [integrationId] = useState<string | null>(
    existingIntegration?.id ?? null,
  );

  // Initiate form (OAuth flow)
  const initiateForm = useForm<InitiateFormValues>({
    resolver: arktypeResolver(initiateFormSchema),
    defaultValues: {
      name: "Shopify Blog",
      shopDomain: "",
      adminUrl: "",
      clientId: "",
      clientSecret: "",
      isDefault: !existingIntegration,
    },
  });

  // Blog selection form
  const blogSelectForm = useForm<BlogSelectFormValues>({
    resolver: arktypeResolver(blogSelectFormSchema),
    defaultValues: {
      blogId: "",
      publishAsHtml: true,
      isDefault: existingIntegration?.isDefault ?? true,
    },
  });

  // Fetch blogs if we have an integration
  const { data: blogsData, isLoading: blogsLoading } = useQuery(
    api.integrations.shopify.listBlogs.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
        id: integrationId ?? "",
      },
      enabled: !!integrationId && step === "select-blog",
    }),
  );

  // Initiate OAuth flow
  const { mutate: initiateOAuth, isPending: isInitiating } = useMutation(
    api.integrations.shopify.initiate.mutationOptions({
      onSuccess: (data) => {
        // Redirect to Shopify OAuth
        window.location.href = data.authorizationUrl;
      },
      onError: (error) => {
        toast.error(`Failed to initiate: ${error.message}`);
      },
    }),
  );

  // Select blog and complete setup
  const { mutate: selectBlog, isPending: isSelectingBlog } = useMutation(
    api.integrations.shopify.selectBlog.mutationOptions({
      onSuccess: () => {
        toast.success("Shopify integration connected!");
        void queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: { organizationIdentifier: organizationSlug, projectId },
          }),
        });
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to complete setup: ${error.message}`);
      },
    }),
  );

  // Remove integration
  const { mutate: removeIntegration, isPending: isRemoving } = useMutation(
    api.integrations.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Shopify integration disconnected!");
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

  const handleInitiate = (values: InitiateFormValues) => {
    initiateOAuth({
      organizationIdentifier: organizationSlug,
      projectId,
      name: values.name,
      shopDomain: values.shopDomain,
      adminUrl: values.adminUrl,
      clientId: values.clientId,
      clientSecret: values.clientSecret,
      isDefault: values.isDefault,
    });
  };

  const handleSelectBlog = (values: BlogSelectFormValues) => {
    if (!integrationId) {
      toast.error("Integration not found.");
      return;
    }

    const selectedBlog = blogsData?.blogs.find((b) => b.id === values.blogId);

    selectBlog({
      organizationIdentifier: organizationSlug,
      projectId,
      id: integrationId,
      blogId: values.blogId,
      blogTitle: selectedBlog?.title,
      publishAsHtml: values.publishAsHtml,
    });
  };

  const handleDisconnect = () => {
    if (!existingIntegration) return;
    removeIntegration({
      id: existingIntegration.id,
      projectId,
      organizationIdentifier: organizationSlug,
    });
  };

  const isPending = isInitiating || isSelectingBlog || isRemoving;

  // If we already have an active Shopify integration, show the blog selection form
  if (existingIntegration?.status === "active") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="font-medium">{existingIntegration.name}</p>
              <p className="text-muted-foreground text-sm">
                Connected • Last used:{" "}
                {existingIntegration.lastUsedAt
                  ? new Date(
                      existingIntegration.lastUsedAt,
                    ).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Button
            disabled={isPending}
            onClick={handleDisconnect}
            type="button"
            variant="destructive"
          >
            Disconnect
          </Button>
          <Button disabled variant="secondary">
            Connected
          </Button>
        </div>
      </div>
    );
  }

  // Blog selection step (after OAuth callback)
  if (step === "select-blog" && integrationId) {
    return (
      <form
        className="space-y-4"
        onSubmit={blogSelectForm.handleSubmit(handleSelectBlog)}
      >
        <p className="text-muted-foreground text-sm">
          Select a blog to publish your articles to.
        </p>

        <FieldGroup>
          <Controller
            control={blogSelectForm.control}
            name="blogId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Blog</FieldLabel>
                {blogsLoading ? (
                  <p className="text-muted-foreground text-sm">
                    Loading blogs...
                  </p>
                ) : (
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a blog" />
                    </SelectTrigger>
                    <SelectContent>
                      {blogsData?.blogs.map((blog) => (
                        <SelectItem key={blog.id} value={blog.id}>
                          {blog.title} ({blog.handle})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={blogSelectForm.control}
            name="publishAsHtml"
            render={({ field }) => (
              <Field
                className="items-center justify-between rounded-lg border p-4"
                orientation="horizontal"
              >
                <div className="space-y-0.5">
                  <FieldLabel>Publish as HTML</FieldLabel>
                  <FieldDescription>
                    Convert markdown to HTML before publishing to Shopify.
                  </FieldDescription>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </Field>
            )}
          />

          <Controller
            control={blogSelectForm.control}
            name="isDefault"
            render={({ field }) => (
              <Field
                className="items-center justify-between rounded-lg border p-4"
                orientation="horizontal"
              >
                <div className="space-y-0.5">
                  <FieldLabel>Default Publishing Destination</FieldLabel>
                  <FieldDescription>
                    Set as the default destination when publishing articles.
                  </FieldDescription>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </Field>
            )}
          />
        </FieldGroup>

        <Separator />

        <div className="flex items-center justify-end">
          <Button
            disabled={isPending || !blogSelectForm.formState.isValid}
            isLoading={isSelectingBlog}
            type="submit"
          >
            Complete Setup
          </Button>
        </div>
      </form>
    );
  }

  // Initial OAuth setup form
  return (
    <form
      className="space-y-4"
      onSubmit={initiateForm.handleSubmit(handleInitiate)}
    >
      <div className="rounded-lg border-yellow-500 border-l-4 bg-yellow-500/10 p-4">
        <p className="text-sm">
          <strong>Note:</strong> This requires creating a custom app in your
          Shopify admin. Go to Settings → Apps and sales channels → Develop apps
          to create one with Content API access.
        </p>
      </div>

      <FieldGroup>
        <Controller
          control={initiateForm.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Integration Name</FieldLabel>
              <Input placeholder="My Shopify Blog" {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={initiateForm.control}
          name="shopDomain"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Shop Domain</FieldLabel>
              <FieldDescription>
                Your Shopify domain (e.g., my-store.myshopify.com)
              </FieldDescription>
              <Input placeholder="my-store.myshopify.com" {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={initiateForm.control}
          name="adminUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Admin URL</FieldLabel>
              <FieldDescription>
                Your Shopify admin URL (e.g.,
                https://admin.shopify.com/store/my-store)
              </FieldDescription>
              <Input
                placeholder="https://admin.shopify.com/store/my-store"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={initiateForm.control}
          name="clientId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Client ID</FieldLabel>
              <FieldDescription>
                From your custom app's API credentials
              </FieldDescription>
              <Input placeholder="Enter client ID" {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={initiateForm.control}
          name="clientSecret"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Client Secret</FieldLabel>
              <FieldDescription>
                From your custom app's API credentials. This is only used during
                setup.
              </FieldDescription>
              <Input
                placeholder="Enter client secret"
                type="password"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={initiateForm.control}
          name="isDefault"
          render={({ field }) => (
            <Field
              className="items-center justify-between rounded-lg border p-4"
              orientation="horizontal"
            >
              <div className="space-y-0.5">
                <FieldLabel>Default Publishing Destination</FieldLabel>
                <FieldDescription>
                  Set as the default destination when publishing articles.
                </FieldDescription>
              </div>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </Field>
          )}
        />
      </FieldGroup>

      <Separator />

      <div className="flex items-center justify-end">
        <Button
          disabled={isPending || !initiateForm.formState.isValid}
          isLoading={isInitiating}
          type="submit"
        >
          Connect to Shopify
        </Button>
      </div>
    </form>
  );
}
