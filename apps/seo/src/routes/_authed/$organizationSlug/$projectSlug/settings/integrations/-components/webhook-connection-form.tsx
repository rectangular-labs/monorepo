import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { getApiClientRq } from "~/lib/api";

type IntegrationSummary =
  RouterOutputs["integrations"]["list"]["integrations"][number];

interface WebhookConnectionFormProps {
  projectId: string;
  organizationSlug: string;
  existingIntegration?: IntegrationSummary;
  onClose: () => void;
  hasIntegrations?: boolean;
}

const formSchema = type({
  name: "string",
  url: type("string.url").atLeastLength(1),
  method: "'POST' | 'PUT'",
  secret: "string",
  secretHeaderName: "string",
  isDefault: "boolean",
});

type FormValues = typeof formSchema.infer;

export function WebhookConnectionForm({
  projectId,
  organizationSlug,
  existingIntegration,
  onClose,
  hasIntegrations = false,
}: WebhookConnectionFormProps) {
  const queryClient = useQueryClient();
  const api = getApiClientRq();

  const form = useForm<FormValues>({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      name: "Webhook",
      url: "",
      method: "POST",
      secret: "",
      secretHeaderName: "X-Webhook-Signature",
      isDefault: existingIntegration?.isDefault ?? !hasIntegrations,
    },
  });

  // Create integration
  const { mutate: createIntegration, isPending: isCreating } = useMutation(
    api.integrations.create.mutationOptions({
      onSuccess: () => {
        toast.success("Webhook integration connected!");
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
        toast.success("Webhook integration updated!");
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
        toast.success("Webhook integration disconnected!");
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

  // Test webhook
  const { mutate: testWebhook, isPending: isTesting } = useMutation(
    api.integrations.webhook.testIntegration.mutationOptions({
      onSuccess: () => {
        toast.success("Webhook test successful!");
      },
      onError: (error) => {
        toast.error(`Webhook test failed: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (values: FormValues) => {
    const config = {
      provider: "webhook" as const,
      url: values.url,
      method: values.method,
    };

    const credentials = values.secret
      ? {
          provider: "webhook" as const,
          secret: values.secret,
          secretHeaderName: values.secretHeaderName || "X-Webhook-Signature",
        }
      : undefined;

    if (existingIntegration) {
      updateIntegration({
        id: existingIntegration.id,
        projectId,
        organizationIdentifier: organizationSlug,
        name: values.name,
        isDefault: values.isDefault,
        config,
        credentials,
      });
    } else {
      createIntegration({
        projectId,
        organizationIdentifier: organizationSlug,
        name: values.name,
        isDefault: values.isDefault,
        config,
        credentials,
      });
    }
  };

  const handleTest = () => {
    if (!existingIntegration) {
      toast.error("Save the webhook first before testing.");
      return;
    }
    testWebhook({
      organizationIdentifier: organizationSlug,
      projectId,
      id: existingIntegration.id,
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

  const isPending = isCreating || isUpdating || isRemoving;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
      {existingIntegration?.lastError && (
        <Alert variant="destructive">
          <AlertTitle>Last publish error</AlertTitle>
          <AlertDescription>{existingIntegration.lastError}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Controller
          control={form.control}
          name="url"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Webhook URL</FieldLabel>
              <FieldDescription>
                The HTTP endpoint to receive published content
              </FieldDescription>
              <Input
                placeholder="https://api.example.com/webhook"
                type="url"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="method"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>HTTP Method</FieldLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="secret"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Signature Secret (optional)</FieldLabel>
              <FieldDescription>
                If provided, we'll sign the payload with HMAC-SHA256 with this
                secret so you can verify that it came from us
              </FieldDescription>
              <Input
                placeholder="Enter a secret key"
                type="password"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="secretHeaderName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Signature Header Name</FieldLabel>
              <FieldDescription>
                The header name for the signature
              </FieldDescription>
              <Input placeholder="X-Webhook-Signature" {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

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
        <div className="flex gap-2">
          {existingIntegration && (
            <>
              <Button
                disabled={isPending}
                onClick={handleDisconnect}
                type="button"
                variant="destructive"
              >
                Disconnect
              </Button>
              <Button
                disabled={isPending || isTesting}
                isLoading={isTesting}
                onClick={handleTest}
                type="button"
                variant="outline"
              >
                Test Webhook
              </Button>
            </>
          )}
        </div>
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
