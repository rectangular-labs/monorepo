"use client";

import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  arktypeResolver,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@rectangular-labs/ui/components/ui/form";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { type } from "arktype";
import { useEffect, useMemo } from "react";
import { useAuth } from "../auth/auth-provider";

function safeParseJson(input: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object")
      return parsed as Record<string, unknown>;
  } catch {
    // do nothing
  }
  return undefined;
}

export type OrganizationSettingCardProps = {
  organization?: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    metadata?: Record<string, unknown> | null;
  } | null;
  onSaved?: () => void;
};

const schema = type({
  name: "string > 0",
  slug: "string > 0",
  logo: "string",
  metadata: "string",
});

export function OrganizationSettingCard({
  organization,
  onSaved,
}: OrganizationSettingCardProps) {
  const isEdit = Boolean(organization?.id);
  const { authClient } = useAuth();

  const form = useForm({
    resolver: arktypeResolver(schema),
    defaultValues: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
      logo: organization?.logo ?? "",
      metadata: organization?.metadata
        ? JSON.stringify(organization.metadata, null, 2)
        : "",
    },
  });

  useEffect(() => {
    if (!organization) return;
    form.reset({
      name: organization.name ?? "",
      slug: organization.slug ?? "",
      logo: organization.logo ?? "",
      metadata: organization.metadata
        ? JSON.stringify(organization.metadata, null, 2)
        : "",
    });
  }, [organization, form.reset]);

  const title = useMemo(
    () => (isEdit ? "Edit organization" : "Create organization"),
    [isEdit],
  );
  const submitText = isEdit ? "Save changes" : "Create";

  async function onSubmit(values: typeof schema.infer) {
    // basic guardrails
    if (!values.name || !values.slug) {
      toast.error("Name and slug are required");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(values.slug)) {
      toast.error("Slug must be lowercase letters, numbers, and hyphens only");
      return;
    }
    const parsedMetadata = values.metadata
      ? safeParseJson(values.metadata)
      : undefined;
    if (isEdit && organization) {
      const response = await authClient.organization.update({
        organizationId: organization.id,
        data: {
          name: values.name,
          slug: values.slug,
          logo: values.logo || undefined,
          metadata: parsedMetadata,
        },
      });

      if (response?.error) {
        toast.error(response.error.message ?? "Failed to update organization");
        return;
      }
      toast.success("Organization updated");
      onSaved?.();
      return;
    }

    const response = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
      logo: values.logo || undefined,
      metadata: parsedMetadata,
    });
    if (response?.error) {
      toast.error(response.error.message ?? "Failed to create organization");
      return;
    }
    toast.success("Organization created");
    onSaved?.();
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update your organization details"
            : "Create a new organization for your workspace"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="acme" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadata (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"plan":"pro"}'
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0">
              <Button className="ml-auto" type="submit">
                {submitText}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
