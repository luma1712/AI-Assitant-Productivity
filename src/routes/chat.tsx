import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { Copy, Eraser } from "lucide-react";
import { toast } from "sonner";

import { AppShell, ResponsibleAiNote } from "@/components/AppShell";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Ask AI — Workplace Chatbot | Workplace AI" },
      {
        name: "description",
        content:
          "Chat with a workplace AI assistant about email drafts, meeting follow-ups, prioritisation and research questions.",
      },
      { property: "og:title", content: "Ask AI — Workplace Chatbot | Workplace AI" },
      {
        property: "og:description",
        content: "A practical AI assistant for everyday workplace questions.",
      },
    ],
  }),
  component: ChatPage,
});

const STARTERS = [
  "Draft a polite follow-up email to a client who hasn't replied.",
  "Summarise these meeting notes into decisions and action items.",
  "Help me prioritise five tasks for tomorrow.",
  "Give me a quick briefing on hybrid work best practice.",
  "Rewrite this message so it sounds more confident.",
];

function textOf(message: { parts: Array<{ type: string; text?: string }> }) {
  return message.parts
    .map((part) => (part.type === "text" ? (part.text ?? "") : ""))
    .join("")
    .trim();
}

function ChatPage() {
  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error) =>
      toast.error(error.message || "The assistant could not reply. Please try again."),
  });

  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    void sendMessage({ text: trimmed });
    store.logActivity("Ask AI", trimmed.slice(0, 60));
  }

  return (
    <AppShell
      title="Ask AI"
      description="Your workplace assistant for writing, planning and quick answers."
    >
      <div className="flex h-[calc(100vh-11rem)] min-h-125 flex-col rounded-2xl border border-border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium">Conversation</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
          >
            <Eraser className="size-4" /> Clear
          </Button>
        </div>

        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                title="How can I help with your work today?"
                description="Pick a starter below or type your own question."
              >
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((message) => {
                const content = textOf(message);
                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      <MessageResponse>{content}</MessageResponse>
                      {message.role === "assistant" && content && (
                        <MessageActions>
                          <MessageAction
                            label="Copy"
                            onClick={async () => {
                              await navigator.clipboard.writeText(content);
                              toast.success("Response copied to your clipboard.");
                            }}
                          >
                            <Copy className="size-3.5" />
                          </MessageAction>
                        </MessageActions>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            )}
            {status === "submitted" && <Shimmer>Thinking...</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border p-3">
          <PromptInput
            onSubmit={(message) => {
              send(message.text ?? "");
            }}
          >
            <PromptInputTextarea placeholder="Ask about email, meetings, planning or research..." />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={busy} />
            </PromptInputFooter>
          </PromptInput>
          <ResponsibleAiNote className="mt-2" />
        </div>
      </div>
    </AppShell>
  );
}
