"use client";

import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rectangular-labs/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../auth/auth-provider";
import { OrganizationCellView } from "./organization-cell-view";
import { OrganizationSettingCard } from "./organization-setting-card";

export type OrganizationSwitcherProps = {
  showCreateButton?: boolean;
  onChanged?: () => void;
};

export function OrganizationSwitcher({
  showCreateButton = true,
  onChanged,
}: OrganizationSwitcherProps) {
  const { authClient } = useAuth();
  // Call hooks unconditionally, fallback to inert values if not available
  const hooks = authClient.organization as unknown as {
    useListOrganizations?: () => { data: OrgSummary[] | null };
    useActiveOrganization?: () => { data: OrgSummary | null };
    setActiveOrganization?: (args: {
      organizationId: string;
    }) => Promise<OrgSummary>;
    setActive?: (args: { organizationId: string }) => Promise<OrgSummary>;
  };
  type OrgSummary = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
  const orgsHook = hooks.useListOrganizations?.() ?? {
    data: [] as OrgSummary[],
  };
  const activeHook = hooks.useActiveOrganization?.() ?? {
    data: null as OrgSummary | null,
  };
  const orgsData = orgsHook.data ?? [];
  const activeOrg = activeHook.data ?? null;
  const [open, setOpen] = useState(false);

  const organizations = orgsData ?? [];
  const activeId = activeOrg?.id ?? null;

  const orgOptions = useMemo(
    () =>
      organizations.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        logo: o.logo,
      })),
    [organizations],
  );

  async function setActive(orgId: string) {
    if (hooks.setActiveOrganization) {
      await hooks.setActiveOrganization({ organizationId: orgId });
    } else if (hooks.setActive) {
      await hooks.setActive({ organizationId: orgId });
    }
    onChanged?.();
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        onValueChange={(v) => void setActive(v)}
        value={activeId ?? undefined}
      >
        <SelectTrigger className="w-60 justify-start">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {orgOptions.map((org) => (
            <SelectItem className="cursor-pointer" key={org.id} value={org.id}>
              <OrganizationCellView
                organization={{
                  id: org.id,
                  name: org.name,
                  slug: org.slug,
                  logo: org.logo,
                }}
                size="sm"
              />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCreateButton && (
        <Dialog onOpenChange={setOpen} open={open}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline">
              <Plus className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create organization</DialogTitle>
            </DialogHeader>
            <OrganizationSettingCard onSaved={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
