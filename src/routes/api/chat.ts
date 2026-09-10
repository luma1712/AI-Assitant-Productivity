import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { CHAT_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are the AI Workplace Assistant inside a productivity app. You help employees, managers, students and professionals with workplace communication, meeting follow-ups, planning, prioritisation and research.

Be concise, practical and professional. Use short paragraphs and bullet points where helpful.

Responsible AI rules:
- Never invent facts, names, dates, deadlines or citations. Ask for missing details instead.
- Never claim you performed a real action such as sending an email or booking a meeting.
- Say plainly when something is outside what you can know.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("AI is not configured for this app yet.", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const result = streamText({
          model: gateway(CHAT_MODEL),
          system: SYSTEM,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
