export const getWorkspaceBlobUri = ({
  orgId,
  projectId,
  campaignId,
}: {
  orgId: string;
  projectId: string;
  campaignId?: string | null;
}) => {
  return `org_${orgId}/proj_${projectId}/content_workspaces/${campaignId ? `c_${campaignId}` : "main"}.loro`;
};
