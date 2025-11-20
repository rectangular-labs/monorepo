import { LoroDoc, UndoManager } from "loro-crdt";
import { type InferInputType, type InferType, schema } from "loro-mirror";
import { createLoroContext } from "loro-mirror-react";

const nodeSchema = schema.LoroMap(
  {
    name: schema.String({
      required: true,
      description: "The name of the node",
    }),
    type: schema.String<"file" | "folder">({
      required: true,
      defaultValue: "file",
      description: "The type of the node",
      validate: (value: unknown) => {
        if (
          typeof value === "string" &&
          (value === "file" || value === "folder")
        )
          return true;
        return `Invalid node type ${value}`;
      },
    }),
    metadata: schema
      .LoroMap(
        {},
        {
          required: true,
          defaultValue: {},
          description: "The metadata of the node",
        },
      )
      .catchall(schema.String()),
    // File node fields (present when type === "file"). For folders, undefined
    content: schema.LoroText({
      required: false,
    }),
  },
  { withCid: true },
);
const workspaceContentSchema = schema({
  root: schema.LoroTree(nodeSchema, {
    defaultValue: [],
    description: "The root of the workspace content tree",
  }),
});

// Create a context
export const { LoroProvider, useLoroState, useLoroSelector, useLoroAction } =
  createLoroContext(workspaceContentSchema);

type WorkspaceContentState = InferType<typeof workspaceContentSchema>;
export type NodeType = WorkspaceContentState["root"][number];

export const initialWorkspaceContentState: InferInputType<
  typeof workspaceContentSchema
> = {
  root: [],
};
export function createConfiguredDoc(): LoroDoc {
  const doc = new LoroDoc();
  doc.setRecordTimestamp(true);
  doc.setChangeMergeInterval(1);
  return doc;
}
export function createUndoManager(doc: LoroDoc): UndoManager {
  return new UndoManager(doc, {});
}
