import { uuidv7 } from "@rectangular-labs/db";
import { type } from "arktype";

export const ProjectImageKindSchema = type(
  "'style-reference'|'brand-logo'|'author-avatar'",
);
type ProjectImageKind = typeof ProjectImageKindSchema.infer;

export const createProjectImageUri = ({
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
  const key = [
    `org_${orgId}`,
    `proj_${projectId}`,
    `img_${kind}`,
    `${uuidv7()}__${fileName}`,
  ].join("/");

  return key;
};
