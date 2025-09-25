import { seoWebsiteInfoSchema } from "@rectangular-labs/db/parsers";
import { safe } from "@rectangular-labs/result";
import { AutoHeight } from "@rectangular-labs/ui/animation/auto-height";
import {
  CardContent,
  CardFooter,
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
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { type } from "arktype";
import type { ReactNode } from "react";

const formSchema = type({
  name: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Name is required",
    }),
  websiteUrl: type("string.url")
    .atLeastLength(1)
    .configure({
      message: () => "Must be a valid URL",
    }),
}).merge(seoWebsiteInfoSchema.omit("version"));
export type ManageProjectFormValues = typeof formSchema.infer;

export function ManageProjectForm({
  defaultValues,
  onSubmit,
  children,
  className,
}: {
  defaultValues?: Partial<ManageProjectFormValues>;
  onSubmit: (values: ManageProjectFormValues) => void | Promise<void>;
  className?: string;
  children?: ReactNode;
}) {
  const form = useForm({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      websiteUrl: defaultValues?.websiteUrl || "",
      businessOverview: defaultValues?.businessOverview || "",
      idealCustomer: defaultValues?.idealCustomer || "",
      serviceRegion: defaultValues?.serviceRegion || "",
      industry: defaultValues?.industry || "",
    },
  });

  const submitForm = async (values: ManageProjectFormValues) => {
    const result = await safe(() => Promise.resolve(onSubmit(values)));
    if (!result.ok) {
      form.setError("root", {
        message: result.error.message,
      });
    }
  };

  return (
    <AutoHeight contentId={`manage-project-form`}>
      <Form {...form}>
        <form className="grid gap-6" onSubmit={form.handleSubmit(submitForm)}>
          <CardContent className={cn("grid gap-6 px-0", className)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My First Project" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://42.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceRegion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Region</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Global, US-only, EU" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., SaaS, Healthcare, Retail"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessOverview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Overview</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What does your business do? The more detail, the better."
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idealCustomer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ideal Customer</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Who are you serving? Like business overview, the more detail here, the better!"
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <FormMessage>{form.formState.errors.root.message}</FormMessage>
            )}
          </CardContent>
          <CardFooter className="px-0">{children}</CardFooter>
        </form>
      </Form>
    </AutoHeight>
  );
}
