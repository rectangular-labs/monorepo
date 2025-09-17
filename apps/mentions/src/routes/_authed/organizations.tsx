import { OrganizationSettingCard } from "@rectangular-labs/auth/components/organization/organization-setting-card";
import { OrganizationSwitcher } from "@rectangular-labs/auth/components/organization/organization-switcher";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/organizations")({
  component: OrganizationsPage,
});

function OrganizationsPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Organizations</h1>
        <OrganizationSwitcher onChanged={() => window.location.reload()} />
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Create a new organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationSettingCard onSaved={() => window.location.reload()} />
        </CardContent>
      </Card>
    </div>
  );
}
