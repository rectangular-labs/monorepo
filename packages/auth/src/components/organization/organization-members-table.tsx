"use client";

import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Card, CardContent } from "@rectangular-labs/ui/components/ui/card";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@rectangular-labs/ui/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import {
  TableBody as DataTableBody,
  TableCell as DataTableCell,
  TableHead as DataTableHead,
  TableHeader as DataTableHeader,
  TableRow as DataTableRow,
  Table,
} from "@rectangular-labs/ui/components/ui/table";
import { useMemo, useState } from "react";
import { useAuth } from "../auth/auth-provider";

type Props = {
  organization: { id: string };
};

export function OrganizationMembersTable({ organization }: Props) {
  const { authClient } = useAuth();
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: membersResp, refetch } = (authClient.organization as any)
    .useListMembers
    ? authClient.organization.useListMembers({
        organizationId: organization.id,
        limit,
        offset: page * limit,
        sortBy: "createdAt",
        sortDirection: "desc",
      })
    : ({
        data: { members: [] as OrgMember[], total: 0 },
        refetch: () => {},
      } as const);
  const members = membersResp?.members ?? [];
  const total = membersResp?.total ?? members.length;

  const canManageMembers = true; // Hook up to roles/permissions later if needed

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold text-base">Members</h3>
          {canManageMembers && (
            <AddMemberForm
              onAdded={() => void refetch()}
              organizationId={organization.id}
            />
          )}
        </div>

        <Table>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Name</DataTableHead>
              <DataTableHead>Email</DataTableHead>
              <DataTableHead>Role</DataTableHead>
              <DataTableHead>Date added</DataTableHead>
              {canManageMembers && (
                <DataTableHead className="text-right">Actions</DataTableHead>
              )}
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {members.map((m: OrgMember) => (
              <MemberRow
                canManage={canManageMembers}
                key={m.id}
                member={m}
                onChanged={() => void refetch()}
              />
            ))}
          </DataTableBody>
        </Table>

        <div className="flex items-center justify-between p-4">
          <span className="text-muted-foreground text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}

type OrgMember = {
  id: string;
  role: string;
  organizationId: string;
  createdAt: string | number | Date;
  email?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

function MemberRow({
  member,
  canManage,
  onChanged,
}: {
  member: OrgMember;
  canManage: boolean;
  onChanged: () => void;
}) {
  const { authClient } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const roles = useMemo(() => ["owner", "admin", "member"], []);

  async function changeRole(role: string) {
    setIsUpdating(true);
    const response = await authClient.organization.updateMemberRole({
      memberId: member.id,
      role,
      organizationId: member.organizationId,
    });
    setIsUpdating(false);
    if (response.error) {
      toast.error(response.error.message ?? "Failed to update role");
      return;
    }
    toast.success("Role updated");
    onChanged();
  }

  async function removeMember() {
    setIsUpdating(true);
    const response = await authClient.organization.removeMember({
      memberIdOrEmail: member.id,
      organizationId: member.organizationId,
    });
    setIsUpdating(false);
    if (response.error) {
      toast.error(response.error.message ?? "Failed to remove member");
      return;
    }
    toast.success("Member removed");
    onChanged();
  }

  return (
    <DataTableRow>
      <DataTableCell>{member.user?.name ?? member.email ?? "—"}</DataTableCell>
      <DataTableCell>{member.user?.email ?? member.email ?? "—"}</DataTableCell>
      <DataTableCell>
        {canManage ? (
          <Select onValueChange={(v) => void changeRole(v)} value={member.role}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem disabled={isUpdating} key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          member.role
        )}
      </DataTableCell>
      <DataTableCell>
        {new Date(member.createdAt).toLocaleDateString()}
      </DataTableCell>
      {canManage && (
        <DataTableCell className="text-right">
          <Button
            disabled={isUpdating}
            onClick={removeMember}
            size="sm"
            variant="outline"
          >
            Remove
          </Button>
        </DataTableCell>
      )}
    </DataTableRow>
  );
}

function AddMemberForm({
  organizationId,
  onAdded,
}: {
  organizationId: string;
  onAdded: () => void;
}) {
  const { authClient } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "member">("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function addMember() {
    setIsSubmitting(true);
    const response = await authClient.organization.inviteMember({
      email,
      role,
      organizationId,
    });
    setIsSubmitting(false);
    if (response.error) {
      toast.error(response.error.message ?? "Failed to invite member");
      return;
    }
    toast.success("Invitation sent");
    setEmail("");
    setRole("member");
    onAdded();
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        onChange={(e) => setEmail(e.target.value)}
        placeholder="member@example.com"
        value={email}
      />
      <Select
        onValueChange={(v) => setRole(v as "owner" | "admin" | "member")}
        value={role}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">owner</SelectItem>
          <SelectItem value="admin">admin</SelectItem>
          <SelectItem value="member">member</SelectItem>
        </SelectContent>
      </Select>
      <Button disabled={isSubmitting} onClick={addMember}>
        Add member
      </Button>
    </div>
  );
}
