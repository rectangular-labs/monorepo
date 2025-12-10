import { uuidv7 } from "@rectangular-labs/db";
import { type } from "arktype";

export const ProjectImageKindSchema = type(
  "'style-reference'|'brand-logo'|'author-avatar'|'content-image'",
);
type ProjectImageKind = typeof ProjectImageKindSchema.infer;

export const getPrivateImageUri = ({
  orgId,
  projectId,
  kind,
  fileName,
}: {
  orgId: string;
  projectId: string;
  kind: ProjectImageKind;
  fileName: string;
} & {
  kind: ProjectImageKind;
}): string => {
  return `org_${orgId}/proj_${projectId}/${kind}/${uuidv7()}__${fileName}`;
};

export const getPublicImageUri = ({
  orgId,
  projectId,
  kind,
  fileName,
}: {
  orgId: string;
  projectId: string;
  kind: ProjectImageKind;
  fileName: string;
}): string => {
  return `org_${orgId}/proj_${projectId}/${kind}/${uuidv7()}__${fileName}`;
};
