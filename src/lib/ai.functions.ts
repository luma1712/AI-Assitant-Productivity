import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

import {
  CHAT_MODEL,
  createLovableAiGatewayProvider,
  extractJson,
  friendlyAiError,
  requireLovableApiKey,
} from "./ai-gateway.server";

const RESPONSIBLE_AI = `Responsible AI rules you must always follow:
- Never invent facts, names, numbers, dates, deadlines, participants, citations or sources.
- Use only the information the user provided plus general professional knowledge.
- When a detail is missing, write "Not specified" instead of guessing.
- Never claim that you performed a real-world action (sending an email, booking a meeting).
- Output only what is asked for, with no preamble, commentary or markdown code fences.`;

async function runJson<T>(system: string, prompt: string): Promise<T> {
  const apiKey = requireLovableApiKey();
  const gateway = createLovableAiGatewayProvider(apiKey);
  try {
    const result = streamText({
      model: gateway(CHAT_MODEL),
      system: `${system}\n\n${RESPONSIBLE_AI}\n\nRespond with a single valid JSON object and nothing else.`,
      prompt,
    });
    const text = await result.text;
    return extractJson<T>(text);
  } catch (error) {
    throw friendlyAiError(error);
  }
}

/* ------------------------------- Email ---------------------------------- */

const EmailInput = z.object({
  purpose: z.string().min(1),
  recipient: z.string().default(""),
  points: z.string().default(""),
  subject: z.string().default(""),
  tone: z.enum(["Formal", "Friendly", "Persuasive", "Concise"]),
  length: z.enum(["Short", "Medium", "Detailed"]),
});

export type EmailResult = { subject: string; body: string };

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const lengthGuide = {
      Short: "about 60-90 words",
      Medium: "about 120-180 words",
      Detailed: "about 220-300 words",
    }[data.length];

    return runJson<EmailResult>(
      `You are a professional workplace communication assistant who writes clear business email.
Understand the user's intent, preserve every important detail they supplied, match the requested tone exactly, use professional language and avoid repetition.
Write the body in ${lengthGuide}, with a greeting, well-structured paragraphs and a sign-off placeholder like "[Your name]" when the sender is unknown.
Return JSON shaped: {"subject": string, "body": string}.`,
      `Purpose: ${data.purpose}
Recipient / context: ${data.recipient || "Not specified"}
Important points to preserve: ${data.points || "Not specified"}
Preferred subject line: ${data.subject || "none — propose one"}
Tone: ${data.tone}
Length: ${data.length}`,
    );
  });

/* ------------------------------ Meetings -------------------------------- */

const MeetingInput = z.object({
  title: z.string().default(""),
  participants: z.string().default(""),
  notes: z.string().min(1),
});

export type ActionItem = { task: string; owner: string; deadline: string; status: string };
export type MeetingResult = {
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  openQuestions: string[];
};

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MeetingInput.parse(input))
  .handler(async ({ data }) => {
    return runJson<MeetingResult>(
      `You are a meeting analyst. Read raw meeting notes and extract only what is explicitly present.
Return JSON shaped: {"summary": string, "decisions": string[], "actionItems": [{"task": string, "owner": string, "deadline": string, "status": string}], "openQuestions": string[]}.
Use "Not specified" for any missing owner, deadline or status. Return an empty array when a section has nothing explicit in the notes.`,
      `Meeting title: ${data.title || "Not specified"}
Participants: ${data.participants || "Not specified"}
Notes:
${data.notes}`,
    );
  });

/* ------------------------------- Planner -------------------------------- */

const PlannerInput = z.object({
  tasks: z.array(
    z.object({
      name: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      duration: z.string().default(""),
      deadline: z.string().default(""),
    }),
  ),
  workingHours: z.string().default(""),
  planDate: z.string().default(""),
  mode: z.enum(["Daily", "Weekly"]),
});

export type ScheduleBlock = {
  task: string;
  day: string;
  start: string;
  end: string;
  duration: string;
  priority: string;
  deadline: string;
};
export type PlannerResult = { blocks: ScheduleBlock[]; explanation: string };

export const planSchedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlannerInput.parse(input))
  .handler(async ({ data }) => {
    return runJson<PlannerResult>(
      `You are a realistic task scheduler. Prioritise by urgency (deadline proximity) and importance (priority), respect estimated durations, keep the plan achievable inside the stated working hours, add short breaks where sensible, and never schedule more work than the hours allow.
Return JSON shaped: {"blocks": [{"task": string, "day": string, "start": string, "end": string, "duration": string, "priority": string, "deadline": string}], "explanation": string}.
"day" is the plan date for a daily plan, or a weekday label for a weekly plan. Times use 24-hour HH:MM. The explanation is 2-4 sentences describing the prioritisation logic. Use "Not specified" for missing deadlines.`,
      `Mode: ${data.mode} plan
Planning date: ${data.planDate || "Not specified"}
Available working hours: ${data.workingHours || "Not specified"}
Tasks:
${data.tasks
  .map(
    (t, i) =>
      `${i + 1}. ${t.name} — priority ${t.priority}, estimated ${t.duration || "Not specified"}, deadline ${t.deadline || "Not specified"}`,
  )
  .join("\n")}`,
    );
  });

/* ------------------------------- Research ------------------------------- */

const ResearchInput = z.object({
  topic: z.string().min(1),
  question: z.string().default(""),
  source: z.string().default(""),
});

export type ResearchResult = {
  basis: string;
  summary: string;
  insights: string[];
  considerations: string[];
  opportunities: string[];
  risks: string[];
  recommendations: string[];
  followUps: string[];
};

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data }) => {
    return runJson<ResearchResult>(
      `You are a research assistant for workplace decision-making. You have no live web access and must never fabricate citations, statistics or sources.
If the user supplied article text, base the answer on that material. Otherwise state clearly in "basis" that the answer draws on general AI knowledge up to your training data and is not sourced from live research.
Return JSON shaped: {"basis": string, "summary": string, "insights": string[], "considerations": string[], "opportunities": string[], "risks": string[], "recommendations": string[], "followUps": string[]}.`,
      `Topic: ${data.topic}
Question: ${data.question || "Not specified"}
Provided article / text: ${data.source ? data.source : "none provided"}`,
    );
  });
