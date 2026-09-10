import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Eraser, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, ResponsibleAiNote } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting, type MeetingResult } from "@/lib/ai.functions";
import { store } from "@/lib/store";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Workplace AI" },
      {
        name: "description",
        content:
          "Paste raw meeting notes and get a summary, decisions, an action-item table and open questions.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer | Workplace AI" },
      {
        property: "og:description",
        content: "Turn long meeting notes into decisions, owners and deadlines.",
      },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const summarize = useServerFn(summarizeMeeting);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<MeetingResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!notes.trim()) {
      toast.error("Paste the meeting notes first.");
      return;
    }
    setLoading(true);
    try {
      const out = await summarize({ data: { title, participants, notes } });
      setResult({
        summary: out.summary ?? "Not specified",
        decisions: out.decisions ?? [],
        actionItems: out.actionItems ?? [],
        openQuestions: out.openQuestions ?? [],
      });
      store.logActivity("Meeting Notes", title || "Meeting summary");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The notes could not be summarised.");
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    if (!result) return;
    const text = [
      `Meeting: ${title || "Not specified"}`,
      `Participants: ${participants || "Not specified"}`,
      "",
      "SUMMARY",
      result.summary,
      "",
      "DECISIONS",
      ...(result.decisions.length ? result.decisions.map((d) => `- ${d}`) : ["- Not specified"]),
      "",
      "ACTION ITEMS",
      ...(result.actionItems.length
        ? result.actionItems.map(
            (a) => `- ${a.task} | ${a.owner} | ${a.deadline} | ${a.status}`,
          )
        : ["- Not specified"]),
      "",
      "OPEN QUESTIONS",
      ...(result.openQuestions.length
        ? result.openQuestions.map((q) => `- ${q}`)
        : ["- Not specified"]),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Summary copied to your clipboard.");
  }

  function clearAll() {
    setTitle("");
    setParticipants("");
    setNotes("");
    setResult(null);
  }

  function updateList(key: "decisions" | "openQuestions", index: number, value: string) {
    if (!result) return;
    const next = [...result[key]];
    next[index] = value;
    setResult({ ...result, [key]: next });
  }

  function updateAction(index: number, field: keyof MeetingResult["actionItems"][number], value: string) {
    if (!result) return;
    const items = result.actionItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setResult({ ...result, actionItems: items });
  }

  return (
    <AppShell
      title="Meeting Notes Summarizer"
      description="Summary, decisions, action items and open questions"
      children={
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meeting details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Q3 product review"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participants">Participants</Label>
                  <Input
                    id="participants"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="Lerato, Sam, Priya"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Meeting notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={12}
                  placeholder="Paste your raw notes or transcript here — however messy they are."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={run} disabled={loading}>
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Summarize
                </Button>
                <Button variant="outline" onClick={run} disabled={loading || !result}>
                  <RefreshCw className="size-4" />
                  Regenerate
                </Button>
                <Button variant="outline" onClick={copyAll} disabled={!result}>
                  <Copy className="size-4" />
                  Copy
                </Button>
                <Button variant="ghost" onClick={clearAll} disabled={loading}>
                  <Eraser className="size-4" />
                  Clear
                </Button>
              </div>
              <ResponsibleAiNote />
            </CardContent>
          </Card>

          {loading && !result && (
            <Card>
              <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Reading the notes…
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={result.summary}
                    onChange={(e) => setResult({ ...result, summary: e.target.value })}
                    rows={5}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Decisions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.decisions.length === 0 && (
                    <p className="text-sm text-muted-foreground">Not specified in the notes.</p>
                  )}
                  {result.decisions.map((decision, i) => (
                    <Textarea
                      key={i}
                      value={decision}
                      rows={2}
                      onChange={(e) => updateList("decisions", i, e.target.value)}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Open questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.openQuestions.length === 0 && (
                    <p className="text-sm text-muted-foreground">Not specified in the notes.</p>
                  )}
                  {result.openQuestions.map((question, i) => (
                    <Textarea
                      key={i}
                      value={question}
                      rows={2}
                      onChange={(e) => updateList("openQuestions", i, e.target.value)}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Action items</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.actionItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No action items were explicitly mentioned.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-56">Task</TableHead>
                            <TableHead className="min-w-36">Responsible</TableHead>
                            <TableHead className="min-w-32">Deadline</TableHead>
                            <TableHead className="min-w-32">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.actionItems.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Input
                                  value={item.task}
                                  onChange={(e) => updateAction(i, "task", e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.owner}
                                  onChange={(e) => updateAction(i, "owner", e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.deadline}
                                  onChange={(e) => updateAction(i, "deadline", e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.status}
                                  onChange={(e) => updateAction(i, "status", e.target.value)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Missing details are shown as “Not specified” — the assistant never guesses
                    owners or deadlines.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      }
    />
  );
}
