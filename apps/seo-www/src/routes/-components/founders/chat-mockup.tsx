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
  contentClassName?: string;
  children: ReactNode;
}

export function ChatMockup({
  className,
  contentClassName,
  children,
}: ChatMockupProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-background/50 p-4 shadow-2xl backdrop-blur-xl",
        className,
      )}
    >
      <div className={cn("space-y-3", contentClassName)}>{children}</div>
    </div>
  );
}

export function ChatMockupMessage({
  from,
  children,
  delay = 0,
  density = "default",
  size = "base",
}: {
  from: "user" | "assistant";
  children: ReactNode;
  delay?: number;
  density?: "default" | "compact";
  size?: "sm" | "base";
}) {
  const id = useId();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <Message
        className={cn("p-0", density === "compact" && "gap-0 py-0")}
        from={from}
      >
        <MessageContent
          className={cn(
            "max-w-none",
            density === "compact" && "bg-transparent px-0 py-0",
          )}
          variant={density === "compact" ? "flat" : "contained"}
        >
          <div
            className={cn(
              "prose dark:prose-invert leading-relaxed",
              size === "sm" ? "prose-sm text-sm" : "prose-base text-base",
            )}
          >
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
