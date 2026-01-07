import {
  Message,
  MessageContent,
} from "@rectangular-labs/ui/components/ai-elements/message";
import { MarkdownContent } from "@rectangular-labs/ui/components/chat/markdown-content";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export interface ChatMockupProps {
  className?: string;
  children: ReactNode;
}

export function ChatMockup({ className, children }: ChatMockupProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-background/50 p-4 shadow-2xl backdrop-blur-xl md:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between border-border border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-rose-500/50" />
          <div className="h-2 w-2 rounded-full bg-amber-500/50" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
        </div>
        <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Fluid Posts AI
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ChatMockupMessage({
  role,
  children,
  delay = 0,
}: {
  role: "user" | "assistant";
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Message from={role} className="p-0">
        <MessageContent className="max-w-none">
          <div className="prose prose-sm dark:prose-invert text-sm leading-relaxed">
            {typeof children === "string" ? (
              <MarkdownContent content={children} />
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
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Tool defaultOpen className="border-border/50 bg-muted/30">
        <ToolHeader state={state} title={title} type="tool-mock" />
        <ToolContent>
          {input && <ToolInput input={input} />}
          {output && (
            <ToolOutput
              output={typeof output === "string" ? output : ""}
              errorText={undefined}
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
