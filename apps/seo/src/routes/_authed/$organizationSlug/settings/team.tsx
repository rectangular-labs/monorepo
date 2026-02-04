import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rectangular-labs/ui/components/ui/dialog";
import {
  arktypeResolver,
  Controller,
  Field,
  FieldError,
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
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rectangular-labs/ui/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { authClient } from "~/lib/auth";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/settings/team",
)({
  component: TeamSettingsPage,
});

type Role =
  RouterOutputs["auth"]["organization"]["members"]["members"][number]["role"];
const ROLE_OPTIONS = ["owner", "admin", "member"] as const;
const inviteMemberSchema = type({
  email: "string.email",
  role: "'owner'|'admin'|'member'",
});
function canManageMembers(role: Role | undefined): boolean {
  return role === "owner" || role === "admin";
}

function canChangeRole(
  currentUserRole: Role | undefined,
  targetMemberRole: Role,
  currentUserId: string,
  targetMemberId: string,
): boolean {
  // Only owners and admins can change roles
  if (!canManageMembers(currentUserRole)) return false;

  // Users cannot change their own role
  if (currentUserId === targetMemberId) return false;

  // Admins cannot change owner roles
  if (currentUserRole === "admin" && targetMemberRole === "owner") return false;

  return true;
}

function canRemoveMember(
  currentUserRole: Role | undefined,
  targetMemberRole: Role,
  currentUserId: string,
  targetMemberId: string,
): boolean {
  // Only owners and admins can remove members
  if (!canManageMembers(currentUserRole)) return false;

  // Cannot remove yourself if you're an admin
  if (currentUserRole === "admin" && currentUserId === targetMemberId)
    return false;

  // Admins cannot remove owners
  if (currentUserRole === "admin" && targetMemberRole === "owner") return false;

  return true;
}

function TeamSettingsPage() {
  const { organizationSlug } = Route.useParams();
  const session = useRouteContext({ from: "/_authed" });
  const api = getApiClientRq();
  const queryClient = useQueryClient();

  const {
    data: membersData,
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery(
    api.auth.organization.members.queryOptions({
      input: { organizationIdentifier: organizationSlug },
    }),
  );

  const {
    data: invitationsData,
    isLoading: isLoadingInvitations,
    error: invitationsError,
  } = useQuery(
    api.auth.organization.invitations.queryOptions({
      input: { organizationIdentifier: organizationSlug },
    }),
  );

  const handleRefetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: api.auth.organization.members.queryKey({
          input: { organizationIdentifier: organizationSlug },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: api.auth.organization.invitations.queryKey({
          input: { organizationIdentifier: organizationSlug },
        }),
      }),
    ]);
  };

  const members = membersData?.members ?? [];
  const currentMember = members.find(
    (member) => member.userId === session.user.id,
  );
  const isAdmin = canManageMembers(currentMember?.role);
  const invitations = invitationsData?.invitations ?? [];

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          Manage your team members and their permissions.
        </p>
      </div>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle>Members</CardTitle>
              <CardDescription>
                People who have access to this organization.
              </CardDescription>
            </div>
            {isAdmin && <InviteMemberDialog onInvited={handleRefetch} />}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMembers && <MembersTableSkeleton />}
          {membersError && (
            <div className="p-6 text-center text-destructive">
              Failed to load members. Please try again.
            </div>
          )}
          {!isLoadingMembers && !membersError && (
            <MembersTable
              currentMember={currentMember}
              members={members}
              onMemberChanged={handleRefetch}
            />
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that have been sent but not yet accepted.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingInvitations && <InvitationsTableSkeleton />}
            {invitationsError && (
              <div className="p-6 text-center text-destructive">
                Failed to load invitations. Please try again.
              </div>
            )}
            {!isLoadingInvitations &&
              !invitationsError &&
              invitations.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  No pending invitations.
                </div>
              )}
            {!isLoadingInvitations &&
              !invitationsError &&
              invitations.length > 0 && (
                <InvitationsTable
                  invitations={invitations}
                  onInvitationCancelled={handleRefetch}
                />
              )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

type Member =
  RouterOutputs["auth"]["organization"]["members"]["members"][number];
type Invitation =
  RouterOutputs["auth"]["organization"]["invitations"]["invitations"][number];

function MembersTable({
  members,
  currentMember,
  onMemberChanged,
}: {
  members: Member[];
  currentMember: Member | undefined;
  onMemberChanged: () => Promise<void>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead className="w-32">Role</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <MemberRow
            currentMember={currentMember}
            key={member.id}
            member={member}
            onMemberChanged={onMemberChanged}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function MemberRow({
  member,
  currentMember,
  onMemberChanged,
}: {
  member: Member;
  currentMember: Member | undefined;
  onMemberChanged: () => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const showRoleDropdown = canChangeRole(
    currentMember?.role,
    member.role,
    currentMember?.userId ?? "",
    member.userId,
  );

  const showRemoveButton = canRemoveMember(
    currentMember?.role,
    member.role,
    currentMember?.userId ?? "",
    member.userId,
  );

  async function handleRoleChange(newRole: Role) {
    setIsUpdating(true);
    try {
      const response = await authClient.organization.updateMemberRole({
        memberId: member.id,
        role: newRole,
        organizationId: member.organizationId,
      });
      if (response.error) {
        toast.error(response.error.message ?? "Failed to update role");
        return;
      }
      toast.success("Role updated successfully");
      await onMemberChanged();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemoveMember() {
    setIsUpdating(true);
    try {
      const response = await authClient.organization.removeMember({
        memberIdOrEmail: member.id,
        organizationId: member.organizationId,
      });
      if (response.error) {
        toast.error(response.error.message ?? "Failed to remove member");
        return;
      }
      toast.success("Member removed successfully");
      await onMemberChanged();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setIsUpdating(false);
    }
  }

  const initials = member.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              alt={member.user.name}
              src={member.user.image ?? undefined}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{member.user.name}</span>
            <span className="text-muted-foreground text-sm">
              {member.user.email}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {showRoleDropdown ? (
          <Select
            disabled={isUpdating}
            onValueChange={(value) => void handleRoleChange(value as Role)}
            value={member.role}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role} value={role}>
                  {role === "owner"
                    ? "Owner"
                    : role === "admin"
                      ? "Admin"
                      : "Member"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <RoleBadge role={member.role} />
        )}
      </TableCell>
      <TableCell>
        {showRemoveButton && (
          <Button
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isUpdating}
            onClick={handleRemoveMember}
            size="icon"
            variant="ghost"
          >
            <Icons.Trash className="h-4 w-4" />
            <span className="sr-only">Remove member</span>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function RoleBadge({ role }: { role: string }) {
  const variant =
    role === "owner" ? "default" : role === "admin" ? "secondary" : "outline";
  return (
    <Badge className="capitalize" variant={variant}>
      {role}
    </Badge>
  );
}

function InvitationsTable({
  invitations,
  onInvitationCancelled,
}: {
  invitations: Invitation[];
  onInvitationCancelled: () => Promise<void>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead className="w-32">Role</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <InvitationRow
            invitation={invitation}
            key={invitation.id}
            onInvitationCancelled={onInvitationCancelled}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function InvitationRow({
  invitation,
  onInvitationCancelled,
}: {
  invitation: Invitation;
  onInvitationCancelled: () => Promise<void>;
}) {
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleCancelInvitation() {
    setIsCancelling(true);
    try {
      const response = await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      });
      if (response.error) {
        toast.error(response.error.message ?? "Failed to cancel invitation");
        return;
      }
      toast.success("Invitation cancelled");
      await onInvitationCancelled();
    } catch {
      toast.error("Failed to cancel invitation");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              <Icons.Send className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground">{invitation.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge role={invitation.role ?? "member"} />
      </TableCell>
      <TableCell>
        <Button
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isCancelling}
          onClick={handleCancelInvitation}
          size="icon"
          variant="ghost"
        >
          <Icons.Trash className="h-4 w-4" />
          <span className="sr-only">Cancel invitation</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function InviteMemberDialog({ onInvited }: { onInvited: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const form = useForm<typeof inviteMemberSchema.infer>({
    resolver: arktypeResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  const handleInvite = form.handleSubmit(async (values) => {
    try {
      const response = await authClient.organization.inviteMember({
        email: values.email.trim(),
        role: values.role,
      });
      if (response.error) {
        toast.error(response.error.message ?? "Failed to send invitation");
        return;
      }
      toast.success("Invitation sent successfully");
      form.reset({ email: "", role: "member" });
      setOpen(false);
      await onInvited();
    } catch {
      toast.error("Failed to send invitation");
    }
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Icons.Plus className="mr-2 h-4 w-4" />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleInvite}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="invite-email"
                    placeholder="member@example.com"
                    type="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role === "owner"
                            ? "Owner"
                            : role === "admin"
                              ? "Admin"
                              : "Member"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MembersTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div className="flex items-center gap-3" key={i}>
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

function InvitationsTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2].map((i) => (
        <div className="flex items-center gap-3" key={i}>
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
