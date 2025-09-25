"use client";

import type { Organization } from "@rectangular-labs/auth/server";
import { ChevronsUpDown, Plus } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@rectangular-labs/ui/components/ui/command";
import DialogDrawer, {
  DialogDrawerDescription,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import PopoverDrawer from "@rectangular-labs/ui/components/ui/popover-drawer";
import { useIsMobile } from "@rectangular-labs/ui/hooks/use-mobile";
import { useState } from "react";
import { ManageOrganizationForm } from "./manage-organization-form";
import { OrganizationCellView } from "./organization-cell-view";
import { OrganizationLogo } from "./organization-logo";

export type OrganizationSwitcherProps<
  T extends React.ComponentType<{ to: string }>,
> = {
  // org list items
  organizations: Organization[];
  isLoadingOrganizations?: boolean;
  // Active org management
  activeOrganizationId: string;
  createHref: (orgSlug: string) => string;
  onSelect: (orgSlug: string) => void;
  anchorComponent?: T;
} & (
  | {
      // Create org
      showCreateButton?: true;
      onCreateOrganization: (
        newOrg: Partial<Organization>,
      ) => void | Promise<void>;
      isCreatingOrganization?: boolean;
    }
  | {
      showCreateButton?: false;
    }
);

export function OrganizationSwitcher<
  T extends React.ComponentType<{ to: string }>,
>({
  organizations,
  isLoadingOrganizations,
  activeOrganizationId,
  createHref,
  onSelect,
  anchorComponent,
  ...createOrgProps
}: OrganizationSwitcherProps<T>) {
  const [openCreateOrgDialog, setOpenCreateOrgDialog] = useState(false);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const activeOrganization = organizations.find(
    (o) => o.id === activeOrganizationId,
  );
  const AnchorComponent = anchorComponent ?? "a";

  const onSelectInternal = (value: string) => {
    setOpen(false);
    setSearch("");
    onSelect(value);
  };

  return (
    <>
      <PopoverDrawer
        onOpenChange={setOpen}
        open={open}
        trigger={
          <div>
            <Button className="md:hidden" size="icon" variant="ghost">
              <OrganizationLogo
                organization={activeOrganization}
                size="default"
              />
            </Button>

            <Button
              className="hidden md:inline-flex md:min-w-52"
              variant="outline"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <AnchorComponent
                  // TODO: Fix this hack
                  // hack for tanstack router link to work properly. We fill in the `to` prop
                  href={createHref(activeOrganization?.slug ?? "")}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  to={createHref(activeOrganization?.slug ?? "")}
                >
                  {activeOrganization?.name}
                </AnchorComponent>
                <ChevronsUpDown
                  className="shrink-0 text-muted-foreground"
                  size={16}
                />
              </div>
            </Button>
          </div>
        }
      >
        <Command
          className={
            isMobile ? "mt-4 rounded-none border-t bg-transparent" : ""
          }
          defaultValue={activeOrganization?.slug || "-"}
        >
          <CommandInput onValueChange={setSearch} value={search} />
          <CommandEmpty
            className={createOrgProps.showCreateButton ? "py-1" : ""}
          >
            {createOrgProps.showCreateButton ? (
              <Button
                className="w-full justify-start"
                onClick={() => setOpenCreateOrgDialog(true)}
                variant="ghost"
              >
                <Plus />{" "}
                <span className="block w-full min-w-0 truncate text-start">
                  Create Org: "{search}"
                </span>
              </Button>
            ) : (
              "No organizations found"
            )}
          </CommandEmpty>
          <CommandList>
            <CommandGroup>
              {isLoadingOrganizations &&
                Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
                  <CommandItem key={i} value={i.toString()}>
                    <OrganizationCellView isPending size="sm" />
                  </CommandItem>
                ))}
              {organizations.map((org) => {
                const href = createHref(org.slug);
                return (
                  <CommandItem
                    asChild
                    key={org.id}
                    onSelect={onSelectInternal}
                    value={org.slug}
                  >
                    <AnchorComponent href={href} to={href}>
                      <OrganizationCellView organization={org} size="sm" />
                    </AnchorComponent>
                  </CommandItem>
                );
              })}
              {createOrgProps.showCreateButton && organizations.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setOpenCreateOrgDialog(true);
                    }}
                    value="."
                  >
                    <div className="flex size-6 items-center justify-center">
                      <Plus className="size-[80%]" />
                    </div>
                    Create organization
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverDrawer>

      {createOrgProps.showCreateButton && (
        <DialogDrawer
          isLoading={createOrgProps.isCreatingOrganization}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSearch("");
            }
            setOpenCreateOrgDialog(isOpen);
          }}
          open={openCreateOrgDialog}
        >
          <DialogDrawerHeader>
            <DialogDrawerTitle>Create organization</DialogDrawerTitle>
            <DialogDrawerDescription>
              You will be able to change this at anytime later on
            </DialogDrawerDescription>
          </DialogDrawerHeader>
          <ManageOrganizationForm
            cancelButton={
              <Button
                onClick={() => setOpenCreateOrgDialog(false)}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
            }
            className="p-4 md:p-0"
            isSaving={createOrgProps.isCreatingOrganization}
            onSaved={async (orgValues) => {
              await Promise.resolve(
                createOrgProps.onCreateOrganization?.(orgValues),
              );
              setOpenCreateOrgDialog(false);
            }}
            organization={{
              name: search,
            }}
          />
        </DialogDrawer>
      )}
    </>
  );
}
