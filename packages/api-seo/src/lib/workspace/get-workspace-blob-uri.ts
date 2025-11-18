export const getWorkspaceBlobUri = ({
  orgId,
  projectId,
  campaignId,
}: {
  orgId: string;
  projectId: string;
  campaignId?: string;
}) => {
  return `org_${orgId}/proj_${projectId}/${campaignId ? `c_${campaignId}` : "main"}.loro`;
};
