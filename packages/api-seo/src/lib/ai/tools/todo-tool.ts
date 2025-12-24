import { uuidv7 } from "@rectangular-labs/db";
import { catOutput, writeToFile } from "@rectangular-labs/loro-file-system";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { LoroDoc } from "loro-crdt";
import { CrdtType } from "loro-protocol";
import type { LoroDocMapping } from "../../../types";
import { getOrCreateRoomDocument } from "../../chat/get-or-create-room-document";
import { WORKSPACE_CONTENT_ROOM_ID } from "../../workspace/constants";
import type { AgentToolDefinition } from "./utils";

export const TASK_FILE_PATH = "/memories/task.md";

async function withLoroTree<TResult>({
  handler,
  shouldPersist,
}: {
  handler: (args: { tree: LoroDocMapping["fs"] }) => TResult | Promise<TResult>;
  shouldPersist: boolean | ((result: TResult) => boolean);
}): Promise<TResult> {
  const roomResult = await getOrCreateRoomDocument(
    WORKSPACE_CONTENT_ROOM_ID,
    CrdtType.Loro,
  );
  if (!roomResult.ok) {
    throw roomResult.error;
  }
  const roomDoc = roomResult.value;
  const loroDoc = loadDocFromRoom(roomDoc.data);
  const tree = getFsRoot(loroDoc);

  const result = await handler({ tree });

  const persist =
    typeof shouldPersist === "boolean" ? shouldPersist : shouldPersist(result);

  if (persist) {
    roomDoc.data = loroDoc.export({ mode: "snapshot" });
    roomDoc.dirty = true;
  }

  return result;
}

function loadDocFromRoom(data: Uint8Array): LoroDoc<LoroDocMapping> {
  const doc = new LoroDoc<LoroDocMapping>();
  if (data.byteLength > 0) {
    doc.import(data);
  }
  return doc;
}

function getFsRoot(doc: LoroDoc<LoroDocMapping>) {
  const tree = doc.getTree("fs");
  return tree;
}

export interface TodoItem {
  id: string;
  title: string;
  status: "open" | "done";
  notes?: string;
}

export function parseTodos(content: string): TodoItem[] {
  const todos: TodoItem[] = [];
  const lines = content.split("\n");
  let currentTodo: Partial<TodoItem> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match todo block format: - [ ] or - [x] followed by title
    const checkboxMatch = trimmed.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (checkboxMatch) {
      // Save previous todo if exists
      if (currentTodo?.id && currentTodo?.title) {
        todos.push(currentTodo as TodoItem);
      }

      const checked = checkboxMatch[1] === "x";
      const title = checkboxMatch[2];
      currentTodo = {
        id: "",
        title,
        status: checked ? "done" : "open",
      };
      continue;
    }

    // Match id line: id: <uuid>
    const idMatch = trimmed.match(/^id:\s*(.+)$/);
    if (idMatch && currentTodo) {
      currentTodo.id = idMatch[1]?.trim() ?? "";
      continue;
    }

    // Match notes line: notes: <text>
    const notesMatch = trimmed.match(/^notes:\s*(.+)$/);
    if (notesMatch && currentTodo) {
      currentTodo.notes = notesMatch[1]?.trim();
    }
  }

  // Save last todo if exists
  if (currentTodo?.id && currentTodo?.title) {
    todos.push(currentTodo as TodoItem);
  }

  return todos;
}

export function formatTodos(todos: TodoItem[]): string {
  if (todos.length === 0) {
    return "# Tasks\n\nNo tasks yet.\n";
  }

  let content = "# Tasks\n\n";
  for (const todo of todos) {
    const checkbox = todo.status === "done" ? "[x]" : "[ ]";
    content += `- ${checkbox} ${todo.title}\n`;
    content += `  id: ${todo.id}\n`;
    if (todo.notes) {
      content += `  notes: ${todo.notes}\n`;
    }
    content += "\n";
  }

  return content;
}

function readTodoFileContent(tree: LoroDocMapping["fs"]): string {
  const readResult = catOutput({
    tree,
    path: TASK_FILE_PATH,
    readContent: (node) => node.data.get("content")?.toString() ?? "",
  });
  return readResult.success ? readResult.data : "";
}

export async function getTodosSnapshot(): Promise<TodoItem[]> {
  return await withLoroTree({
    handler: ({ tree }) => {
      const existingContent = readTodoFileContent(tree);
      return parseTodos(existingContent);
    },
    shouldPersist: false,
  });
}

export function formatTodoFocusReminder({
  todos,
  maxOpen,
}: {
  todos: readonly TodoItem[];
  maxOpen: number;
}): string {
  const open = todos.filter((t) => t.status === "open");
  const current = open[0];
  const openPreview = open.slice(0, Math.max(0, maxOpen));

  const currentLine = current
    ? `Current focus (next open todo): ${current.title} (id: ${current.id})`
    : "Current focus: (no open todos)";

  const openLines =
    openPreview.length > 0
      ? openPreview.map((t) => `- [ ] ${t.title} (id: ${t.id})`).join("\n")
      : "- (none)";

  return [
    "## System reminder: task tracking",
    currentLine,
    "",
    "Open todos (top):",
    openLines,
    "",
    "Use manage_todo to add new tasks and to mark tasks done as you complete them.",
  ].join("\n");
}

const manageTodoInputSchema = type({
  action: "'create'|'update'|'list'",
  "todo?": type({
    "id?": "string",
    title: "string",
    "status?": "'open'|'done'",
    "notes?": "string",
  }),
});

export function createTodoToolWithMetadata() {
  const manageTodo = tool({
    description:
      "Manage todos for the SEO campaign. Create new todos, list existing todos, or update existing ones by id. Todos are persisted to /memories/task.md in the workspace.",
    inputSchema: jsonSchema<typeof manageTodoInputSchema.infer>(
      manageTodoInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ action, todo }) {
      return await withLoroTree({
        handler: ({ tree }) => {
          const existingContent = readTodoFileContent(tree);
          const todos = parseTodos(existingContent);

          if (action === "list") {
            return {
              success: true,
              todos,
            };
          }

          if (action === "create") {
            if (!todo?.title) {
              return { success: false, message: "Todo title is required" };
            }
            const newId = todo.id ?? uuidv7();
            const newTodo: TodoItem = {
              id: newId,
              title: todo.title,
              status: todo.status ?? "open",
              notes: todo.notes,
            };
            todos.push(newTodo);

            const newContent = formatTodos(todos);
            const writeResult = writeToFile({
              tree,
              path: TASK_FILE_PATH,
              content: newContent,
              createIfMissing: true,
            });

            if (!writeResult.success) {
              return {
                success: false,
                message: `Failed to write todo: ${writeResult.message}`,
              };
            }

            return {
              success: true,
              message: `Created todo: ${newTodo.title}`,
              todo: newTodo,
            };
          }

          if (action === "update") {
            if (!todo?.id) {
              return {
                success: false,
                message: "Todo id is required for update action",
              };
            }
            const index = todos.findIndex((t) => t.id === todo.id);
            if (index === -1) {
              return {
                success: false,
                message: `Todo with id ${todo.id} not found`,
              };
            }

            const existingTodo = todos[index];
            if (!existingTodo) {
              return {
                success: false,
                message: `Todo with id ${todo.id} not found`,
              };
            }
            if (!todo.title) {
              return {
                success: false,
                message: "Todo title is required for update action",
              };
            }

            const updatedTodo: TodoItem = {
              ...existingTodo,
              title: todo.title,
              status: todo.status ?? existingTodo.status,
              notes: todo.notes !== undefined ? todo.notes : existingTodo.notes,
            };
            todos[index] = updatedTodo;

            const newContent = formatTodos(todos);
            const writeResult = writeToFile({
              tree,
              path: TASK_FILE_PATH,
              content: newContent,
              createIfMissing: true,
            });

            if (!writeResult.success) {
              return {
                success: false,
                message: `Failed to update todo: ${writeResult.message}`,
              };
            }

            return {
              success: true,
              message: `Updated todo: ${updatedTodo.title}`,
              todo: updatedTodo,
            };
          }

          return {
            success: false,
            message: `Unknown action: ${action}`,
          };
        },
        shouldPersist: action !== "list",
      });
    },
  });

  const tools = { manage_todo: manageTodo } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "manage_todo",
      toolDescription:
        "Create, list, and update campaign todos stored at /memories/task.md.",
      toolInstruction:
        "Use action='list' to see current tasks. Use action='create' with todo.title (and optional notes/status). Use action='update' with todo.id and updated fields; mark done by setting status='done'. Keep todos atomic and execution-oriented.",
      tool: manageTodo,
    },
  ];

  return { toolDefinitions, tools };
}

export function createTodoTool(): ReturnType<
  typeof createTodoToolWithMetadata
>["tools"] {
  return createTodoToolWithMetadata().tools;
}
