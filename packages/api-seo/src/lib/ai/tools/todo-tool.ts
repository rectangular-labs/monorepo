import { uuidv7 } from "@rectangular-labs/db";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import type { SeoChatMessage } from "../../../types";
import type { AgentToolDefinition } from "./utils";

interface TodoItem {
  id: string;
  title: string;
  status: "open" | "done";
  notes?: string;
  dependencies: string[];
}

function extractManageTodoSnapshotsFromMessages(
  messages: SeoChatMessage[],
): TodoItem[] {
  const snapshots: TodoItem[][] = [];

  for (const message of messages) {
    const parts = message.parts;
    for (const part of parts) {
      if (part.type !== "tool-manage_todo") continue;
      const result = part.output?.todos;

      if (result?.length) {
        snapshots.push(result);
      }
    }
  }

  const last = snapshots.at(-1);
  return last ?? [];
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
    '<system-reminder type="task tracking">',
    currentLine,
    "",
    "Open todos (top):",
    openLines,
    "",
    "Use manage_todo to add new tasks and to mark tasks done as you complete them.",
    "</system-reminder>",
  ].join("\n");
}

const manageTodoInputSchema = type({
  action: "'create'|'update'|'list'",
  "todo?": type({
    "id?": "string",
    title: "string",
    "status?": "'open'|'done'",
    "notes?": "string",
    "dependencies?": "string[]",
  }),
});

export function createTodoToolWithMetadata(args: {
  messages: SeoChatMessage[];
}) {
  let todos = extractManageTodoSnapshotsFromMessages(args.messages);

  const manageTodo = tool({
    description:
      "Manage todos for the SEO chat. Todos are stored in chat history via tool results (not in the workspace filesystem).",
    inputSchema: jsonSchema<typeof manageTodoInputSchema.infer>(
      // Google api doesn't support const keyword in json schema for anyOf, only string.
      JSON.parse(
        JSON.stringify(manageTodoInputSchema.toJsonSchema()).replaceAll(
          "enum",
          'type":"string","enum',
        ),
      ) as JSONSchema7,
    ),
    async execute({ action, todo }) {
      await Promise.resolve();
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
        const newTodo: TodoItem = {
          id: todo.id ?? uuidv7(),
          title: todo.title,
          status: todo.status ?? "open",
          notes: todo.notes,
          dependencies: todo.dependencies ?? [],
        };

        todos = [...todos, newTodo];

        return {
          success: true,
          message: `Created todo: ${newTodo.title}`,
          todos,
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
          throw new Error(`BAD STATE: Todo with id ${todo.id} not found`);
        }
        const title = todo.title ?? existingTodo.title;
        todos[index] = {
          ...existingTodo,
          title,
          status: todo.status ?? existingTodo.status,
          notes: todo.notes !== undefined ? todo.notes : existingTodo.notes,
          dependencies: todo.dependencies ?? existingTodo.dependencies,
        };

        return {
          success: true,
          message: `Updated todo: ${title}`,
          todos,
        };
      }

      return {
        success: false,
        message: `Unknown action: ${action}. Action must be one of: create, list, update.`,
      };
    },
  });

  const tools = { manage_todo: manageTodo } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "manage_todo",
      toolDescription: "Create, list, and update chat todos.",
      toolInstruction:
        "Use action='list' to see current tasks. Use action='create' with todo.title (and optional notes/status/dependencies). Use action='update' with todo.id and updated fields; mark done by setting status='done'. Provide dependencies as a list of todo ids that must be completed before this todo can be started to help keep organize of what order things should be done in. Otherwise simply give them in order of execution. Keep todos atomic and execution-oriented.",
      tool: manageTodo,
    },
  ];

  return {
    toolDefinitions,
    tools,
    getSnapshot: () => todos,
  };
}
