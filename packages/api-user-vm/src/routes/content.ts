"use server";
import { streamToEventIterator } from "@orpc/client";
import { type } from "@orpc/server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { claudeCode } from "ai-sdk-provider-claude-code";
import { base } from "../context";

const write = base
  .route({ method: "POST", path: "/write" })
  .input(type<{ chatId: string; messages: UIMessage[] }>())
  .handler(({ input }) => {
    const result = streamText({
      model: claudeCode("haiku", {
        systemPrompt: { type: "preset", preset: "claude_code" },
        settingSources: ["user", "project", "local"],
      }),
      messages: convertToModelMessages(input.messages),
    });

    streamToEventIterator(result.toUIMessageStream());
  });
export default base.prefix("/content").router({ write });
