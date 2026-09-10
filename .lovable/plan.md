# AI Workplace Productivity Assistant

A SaaS-style AI productivity platform with a dashboard and five AI tools, built with real AI (Lovable AI) — no mocked responses.

## Pages

1. **Dashboard (home)** — sidebar + header shell, welcome section, productivity stats, five quick-action buttons (Generate Email, Summarize Meeting, Plan My Day, Research Topic, Ask AI), recent AI activity, today's tasks, AI insights, and a responsible-AI disclaimer.
2. **Smart Email Generator** — purpose, recipient/context, key points, optional subject, tone (Formal / Friendly / Persuasive / Concise), length (Short / Medium / Detailed). Returns a suggested subject plus an editable email body. Generate / Regenerate / Copy / Clear.
3. **Meeting Notes Summarizer** — title, participants, long notes. Returns Summary, Decisions, Action Items (task, owner, deadline, status table), and Open Questions. Missing details show "Not specified". Output editable. Summarize / Regenerate / Copy / Clear.
4. **Task Planner / Scheduler** — add multiple tasks (name, priority, duration, deadline) plus working hours, planning date, and daily/weekly mode. Returns a timeline-style schedule with time, duration, priority, deadline, plus a short explanation of the prioritisation logic. Tasks can be completed, edited, deleted; schedule can be regenerated.
5. **Research Assistant** — topic, question, optional article text. Returns topic summary, key insights, considerations, opportunities, risks/limitations, recommendations, follow-up questions. Editable and copyable. States clearly when the answer relies on general AI knowledge; never fabricates sources.
6. **Workplace Chatbot** — chat interface with user/AI messages, streaming responses, thinking indicator, timestamps, copy per response, clear conversation, and the five example prompts as starter chips.

## Design

Professional SaaS look: light neutral canvas, indigo/blue accent, rounded cards with soft shadows, clear typographic hierarchy, collapsible sidebar that becomes a slide-over on mobile. Fully responsive across desktop, tablet, and mobile.

## Technical notes

- Routes: `/` (dashboard), `/email`, `/meetings`, `/planner`, `/research`, `/chat`, sharing one app-shell layout with sidebar + header.
- AI runs server-side through Lovable AI. Chat uses a streaming server route (`/api/chat`); the four tools use server functions returning structured output (schema-light, prompt-stated limits, guarded parsing).
- Each tool has its own structured system prompt casting the AI as a workplace assistant with explicit rules: preserve user-supplied facts, match the requested tone, never invent facts, participants, deadlines, or citations, never claim an email was sent, output only the requested content.
- Session state (tasks, recent activity, chat history) lives in the browser for this build — no accounts or database. Data resets on refresh unless you want it saved.
- Semantic design tokens in `src/styles.css`; shadcn components; AI Elements for the chat surface.
- Per-page titles and descriptions for search/social previews.

## Open item

Persistence (saved history, tasks that survive refresh, user accounts) is not included. Say the word and I'll add a backend for it.
