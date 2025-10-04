import {
  COUNTRY_CODE_MAP,
  seoWebsiteInfoSchema,
} from "@rectangular-labs/db/parsers";
import { safe } from "@rectangular-labs/result";
import { AutoHeight } from "@rectangular-labs/ui/animation/auto-height";
import { X } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  CardContent,
  CardFooter,
} from "@rectangular-labs/ui/components/ui/card";
import {
  arktypeResolver,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFieldArray,
  useForm,
} from "@rectangular-labs/ui/components/ui/form";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
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
      targetCountryCode: defaultValues?.targetCountryCode || "",
      targetCity: defaultValues?.targetCity || "",
      industry: defaultValues?.industry || "",
      languageCode: defaultValues?.languageCode || "",
      competitorsWebsites: defaultValues?.competitorsWebsites || [],
      writingStyle: defaultValues?.writingStyle || "",
    },
  });

  const {
    fields: competitorFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "competitorsWebsites",
    keyName: "url",
  });
  console.log("competitorFields", competitorFields);

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
              name="serviceRegion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Region</FormLabel>
                  <FormDescription>
                    Where you serve customers. This is your overall footprint
                    (e.g., Global; EU; US; City, ST; list of countries). For the
                    primary country used for defaults like search locale, use
                    Target Country Code below.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Global, US-only, EU" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCountryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Country</FormLabel>
                  <FormDescription>
                    The country where most of your audience is located.
                  </FormDescription>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(COUNTRY_CODE_MAP).map((code) => (
                        <SelectItem key={code} value={code}>
                          {COUNTRY_CODE_MAP[code]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary City (optional)</FormLabel>
                  <FormDescription>
                    If most of your audience is concentrated in a specific
                    city/metro. Leave blank if not applicable.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="San Francisco" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="languageCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language Code</FormLabel>
                  <FormDescription>
                    Two-letter ISO 639-1 language code for your audience.
                    Examples: en, es, de.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="en" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Competitors Websites</FormLabel>
              <FormDescription>
                List URLs of direct competitors. Add as many as you like.
              </FormDescription>
              <div className="grid gap-3">
                {competitorFields.map((item, index) => (
                  <FormField
                    control={form.control}
                    key={item.url}
                    name={`competitorsWebsites.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange({ url: e.target.value });
                              }}
                              placeholder="https://competitor.com"
                              value={field.value.url}
                            />
                          </FormControl>
                          <Button
                            aria-label="Remove competitor website"
                            onClick={() => remove(index)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <X />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <div className="flex justify-end">
                  <Button
                    onClick={() => append({ url: "" })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Add competitor website
                  </Button>
                </div>
              </div>
            </FormItem>

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

            <FormField
              control={form.control}
              name="writingStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Writing Style</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="How do you want to write? The more detail, the better."
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
