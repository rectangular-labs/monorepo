import {
  Message,
  MessageContent,
} from "@rectangular-labs/ui/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@rectangular-labs/ui/components/ai-elements/tool";
import { MarkdownContent } from "@rectangular-labs/ui/components/chat/markdown-content";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { motion } from "motion/react";
import { type ReactNode, useId } from "react";

export interface ChatMockupProps {
  className?: string;
  children: ReactNode;
}

export function ChatMockup({ className, children }: ChatMockupProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-muted/30 p-4 shadow-2xl backdrop-blur-xl",
        className,
      )}
    >
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function ChatMockupMessage({
  from,
  children,
  delay = 0,
}: {
  from: "user" | "assistant";
  children: ReactNode;
  delay?: number;
}) {
  const id = useId();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <Message className="p-0" from={from}>
        <MessageContent
          className={cn(
            "max-w-none",
            // Ensure mockup "user" bubbles remain readable regardless of theme tokens.
            "group-[.is-user]:border group-[.is-user]:border-border group-[.is-user]:bg-muted group-[.is-user]:text-foreground",
          )}
        >
          <div className="prose prose-base dark:prose-invert prose-p:text-foreground prose-strong:text-foreground text-base text-foreground leading-relaxed">
            {typeof children === "string" ? (
              <MarkdownContent content={children} id={id} />
            ) : (
              children
            )}
          </div>
        </MessageContent>
      </Message>
    </motion.div>
  );
}

export function ChatMockupTool({
  title,
  input,
  output,
  state = "output-available",
  delay = 0,
}: {
  title: string;
  input?: string;
  output?: string | ReactNode;
  state?:
    | "output-available"
    | "input-available"
    | "input-streaming"
    | "output-error";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      <Tool className="border-border/50 bg-muted/30" defaultOpen>
        <ToolHeader state={state} title={title} type="tool-mock" />
        <ToolContent>
          {input && <ToolInput input={input} />}
          {output && (
            <ToolOutput
              errorText={undefined}
              output={typeof output === "string" ? output : ""}
            />
          )}
          {typeof output !== "string" && output && (
            <div className="mt-2 text-xs">{output}</div>
          )}
        </ToolContent>
      </Tool>
    </motion.div>
  );
}
