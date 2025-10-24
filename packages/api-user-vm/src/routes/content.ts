"use server";
import { streamToEventIterator } from "@orpc/client";
import { type } from "@orpc/server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { claudeCode } from "ai-sdk-provider-claude-code";
import { protectedBase } from "../context";

const write = protectedBase
  .route({ method: "POST", path: "/write" })
  .input(type<{ chatId: string; messages: UIMessage[] }>())
  .handler(({ input }) => {
    const result = streamText({
      model: claudeCode("haiku", {
        systemPrompt: { type: "preset", preset: "claude_code" },
        settingSources: ["user", "project", "local"],
        allowedTools: [
          "Read",
          "Write",
          "Edit",
          "Grep",
          "Glob",
          "Bash",
          "BashOutput",
          "KillShell",
          "Task",
          "TodoWrite",
          "WebFetch",
          "WebSearch",
        ],
      }),
      messages: convertToModelMessages(input.messages),
      onStepFinish: (step) => {
        console.log("step", step);
      },
      onFinish: (result) => {
        console.log("result", result);
      },
    });

    return streamToEventIterator(
      result.toUIMessageStream({
        sendSources: true,
        sendReasoning: true,
      }),
    );
  });
export default protectedBase.prefix("/api/user-vm/content").router({ write });
