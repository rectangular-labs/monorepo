import {
  COUNTRY_CODE_MAP,
  businessBackgroundSchema,
} from "@rectangular-labs/db/parsers";
import { Button } from "@rectangular-labs/ui/components/ui/button";
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
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useLocalStorage } from "@rectangular-labs/ui/hooks/use-local-storage";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/settings/",
)({
  component: BetaProjectSettings,
});

const formSchema = type({
  name: type("string").atLeastLength(1),
  websiteUrl: type("string.url").atLeastLength(1),
}).merge(businessBackgroundSchema);
type FormValues = typeof formSchema.infer;

function BetaProjectSettings() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const key = `seo-beta:settings:${organizationSlug}:${projectSlug}`;
  const [saved, setSaved] = useLocalStorage<FormValues>(key, {
    name: "My Project",
    websiteUrl: "https://example.com",
    version: "v1",
    businessOverview: "",
    targetAudience: "",
    caseStudies: [],
    industry: "",
    serviceRegion: "",
    targetCountryCode: "",
    targetCity: "",
    languageCode: "en",
    competitorsWebsites: [],
  });

  const form = useForm<FormValues>({
    resolver: arktypeResolver(formSchema),
    defaultValues: saved,
  });

  useEffect(() => {
    form.reset(saved);
  }, [saved, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "competitorsWebsites",
    keyName: "url",
  });

  const submit = (values: FormValues) => {
    setSaved(values);
    toast.success("Saved (beta mock)");
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">Project settings</h1>
        <p className="text-muted-foreground">
          Mocked settings (saved to localStorage). No backend calls.
        </p>
      </div>

      <Form {...form}>
        <form className="grid gap-6" onSubmit={form.handleSubmit(submit)}>
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
            name="businessOverview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business overview</FormLabel>
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
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target audience</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Who are you serving? The more detail here, the better."
                    rows={5}
                  />
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
                  <Input {...field} placeholder="e.g., SaaS, Healthcare, Retail" />
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
                <FormLabel>Service region</FormLabel>
                <FormDescription>
                  Where you serve customers (e.g., Global; EU; US; City, ST; list
                  of countries).
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
                <FormLabel>Target country</FormLabel>
                <FormDescription>
                  The country where most of your audience is located.
                </FormDescription>
                <Select defaultValue={field.value} onValueChange={field.onChange}>
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
                <FormLabel>Primary city (optional)</FormLabel>
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
                <FormLabel>Language code</FormLabel>
                <FormDescription>Two-letter ISO 639-1 language code.</FormDescription>
                <FormControl>
                  <Input {...field} placeholder="en" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Competitors websites</FormLabel>
            <FormDescription>List URLs of direct competitors.</FormDescription>
            <div className="grid gap-3">
              {fields.map((item, index) => (
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
                            onChange={(e) =>
                              field.onChange({ url: e.target.value })
                            }
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
                          ×
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

          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => form.reset(saved)} type="button" variant="outline">
              Reset
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}


