import { toSlug } from "@rectangular-labs/core/format/to-slug";
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
  Controller,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { type } from "arktype";
import { useState } from "react";
import { getApiClient } from "~/lib/api";
import { authClient } from "~/lib/auth";
import { OnboardingSteps } from "../-lib/steps";

const backgroundSchema = type({
  name: type("string").atLeastLength(1),
});

export function OnboardingCreateOrganization() {
  const matcher = OnboardingSteps.useStepper();
  const form = useForm({
    resolver: arktypeResolver(backgroundSchema),
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: typeof backgroundSchema.infer) => {
    const slug = toSlug(values.name);
    setIsLoading(true);
    const valid = await authClient.organization.checkSlug({
      slug,
    });
    if (valid.error) {
      setIsLoading(false);
      form.setError("root", {
        message:
          valid.error.message ??
          "Something went wrong creating the organization. Please try again later",
      });
      return;
    }
    if (!valid.data?.status || slug === "organization") {
      setIsLoading(false);
      form.setError("name", {
        message: "Organization name already taken, please choose another one.",
      });
      return;
    }

    const organizationResult = await authClient.organization.create({
      name: values.name,
      slug,
    });
    setIsLoading(false);

    if (organizationResult.error) {
      form.setError("root", {
        message:
          organizationResult.error.message ||
          organizationResult.error.statusText,
      });
      setIsLoading(false);
      return;
    }
    await getApiClient().auth.organization.setActive({
      organizationId: organizationResult.data.id,
      organizationSlug: organizationResult.data.slug,
    });

    matcher.next();
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <Card className="rounded-none sm:rounded-lg">
        <CardHeader>
          <CardTitle>Set Up Organization</CardTitle>
          <CardDescription>
            Your organization will let you manage team members and projects.
          </CardDescription>
        </CardHeader>
        <form className="grid gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent>
            <FieldGroup>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="onboarding-create-organization-name">
                      Organization Name
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="onboarding-create-organization-name"
                      placeholder="Xerox"
                    />
                    <FieldDescription>
                      You will be able to change this at anytime later on
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {form.formState.errors.root && (
              <FieldError errors={[form.formState.errors.root]} />
            )}
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-between">
              <Button
                onClick={() => matcher.prev()}
                type="button"
                variant="ghost"
              >
                Back
              </Button>
              <Button className={"w-fit"} isLoading={isLoading} type="submit">
                Continue
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
