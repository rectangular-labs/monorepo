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
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Member } from "../../server";
import { useAuth } from "../auth/auth-provider";

type Role = Member["role"];
function isRole(value: unknown): value is Role {
  return value === "owner" || value === "admin" || value === "member";
}

function formatCreatedAt(createdAt: string | Date | null | undefined): string {
  if (!createdAt) return "—";
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

type Props = {
  organization: { id: string };
};

export function OrganizationMembersTable({ organization }: Props) {
  const { authClient } = useAuth();
  const limit = 10;

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery({
    queryKey: ["organization-members", organization.id, limit],
    queryFn: async ({ pageParam = 0 }) => {
      return await authClient.organization.listMembers({
        query: {
          organizationId: organization.id,
          limit,
          offset: typeof pageParam === "number" ? pageParam : 0,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const count = lastPage.data?.members.length ?? 0;
      if (count < limit) return undefined;
      return allPages.length * limit;
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
      const current = typeof firstPageParam === "number" ? firstPageParam : 0;
      const prev = current - limit;
      return prev >= 0 ? prev : undefined;
    },
  });

  const pages = data?.pages ?? [];
  const members = pages.flatMap((page) => page.data?.members ?? []);

  const lastPage = pages[pages.length - 1];
  const total = lastPage?.data?.total ?? members.length;

  const canManageMembers = true;

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
            {isLoading && (
              <DataTableRow>
                <DataTableCell colSpan={5}>Loading…</DataTableCell>
              </DataTableRow>
            )}
            {isError && (
              <DataTableRow>
                <DataTableCell colSpan={5}>
                  Failed to load members
                </DataTableCell>
              </DataTableRow>
            )}
            {!isLoading &&
              !isError &&
              members?.map((m) => (
                <MemberRow
                  canManage={canManageMembers}
                  key={m.id}
                  member={m as Member}
                  onChanged={() => void refetch()}
                />
              ))}
          </DataTableBody>
        </Table>

        <div className="flex items-center justify-between p-4">
          <span className="text-muted-foreground text-sm">
            Page {Math.max(1, Math.ceil(members.length / limit))} of{" "}
            {totalPages}
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => void fetchPreviousPage()} />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext onClick={() => void fetchNextPage()} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberRow({
  member,
  canManage,
  onChanged,
}: {
  member: Member;
  canManage: boolean;
  onChanged: () => void;
}) {
  const { authClient } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const roles = useMemo<Role[]>(() => ["owner", "admin", "member"], []);

  async function changeRole(role: Role) {
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

  const createdAtText = formatCreatedAt(member.createdAt);

  return (
    <DataTableRow>
      <DataTableCell>{member.user?.name ?? "—"}</DataTableCell>
      <DataTableCell>{member.user?.email ?? "—"}</DataTableCell>
      <DataTableCell>
        {canManage ? (
          <Select
            // TODO: add confirmation dialog when downgrading self
            onValueChange={(v) => {
              if (isRole(v)) void changeRole(v);
            }}
            value={member.role}
          >
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
      <DataTableCell>{createdAtText}</DataTableCell>
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
        onValueChange={(v) => {
          if (isRole(v)) setRole(v);
        }}
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
