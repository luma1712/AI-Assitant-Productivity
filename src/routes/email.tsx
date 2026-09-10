import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Eraser, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, ResponsibleAiNote } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";
import { store } from "@/lib/store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Workplace AI" },
      {
        name: "description",
        content:
          "Generate professional workplace email with the tone and length you need, then edit and copy the draft.",
      },
      { property: "og:title", content: "Smart Email Generator | Workplace AI" },
      {
        property: "og:description",
        content: "AI-written professional email drafts you can edit before sending.",
      },
    ],
  }),
  component: EmailPage,
});

type Tone = "Formal" | "Friendly" | "Persuasive" | "Concise";
type Length = "Short" | "Medium" | "Detailed";

function EmailPage() {
  const generate = useServerFn(generateEmail);
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [points, setPoints] = useState("");
  const [subjectHint, setSubjectHint] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");
  const [length, setLength] = useState<Length>("Medium");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!purpose.trim()) {
      toast.error("Tell the assistant what the email is for.");
      return;
    }
    setLoading(true);
    try {
      const result = await generate({
        data: {
          purpose,
          recipient,
          points,
          subject: subjectHint,
          tone,
          length,
        },
      });
      setSubject(result.subject ?? "");
      setBody(result.body ?? "");
      store.logActivity("Email Generator", result.subject || purpose.slice(0, 60));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The email could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast.success("Email copied to your clipboard.");
  }

  function clearAll() {
    setPurpose("");
    setRecipient("");
    setPoints("");
    setSubjectHint("");
    setSubject("");
    setBody("");
  }

  return (
    <AppShell
      title="Smart Email Generator"
      description="Turn a few notes into a polished professional email"
      children={
        <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What should the email do?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Email purpose</Label>
                <Textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ask a client for a two-week extension on the report deadline"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient / context</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Thabo, project sponsor at Nexus Retail"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Important points to include</Label>
                <Textarea
                  id="points"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Data arrived late; new date 30 Sep; interim summary on Friday"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject-hint">Subject (optional)</Label>
                <Input
                  id="subject-hint"
                  value={subjectHint}
                  onChange={(e) => setSubjectHint(e.target.value)}
                  placeholder="Leave empty and the AI will suggest one"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["Formal", "Friendly", "Persuasive", "Concise"] as const).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Length</Label>
                  <Select value={length} onValueChange={(v) => setLength(v as Length)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["Short", "Medium", "Detailed"] as const).map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button onClick={run} disabled={loading}>
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Generate
                </Button>
                <Button variant="outline" onClick={run} disabled={loading || !body}>
                  <RefreshCw className="size-4" />
                  Regenerate
                </Button>
                <Button variant="ghost" onClick={clearAll} disabled={loading}>
                  <Eraser className="size-4" />
                  Clear
                </Button>
              </div>
              <ResponsibleAiNote />
            </CardContent>
          </Card>

          <Card className="lg:sticky lg:top-24 lg:self-start">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Draft</CardTitle>
              <Button variant="outline" size="sm" onClick={copyAll} disabled={!body}>
                <Copy className="size-4" />
                Copy
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {!body && !loading && (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Your generated email will appear here, fully editable.
                </p>
              )}
              {loading && !body && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Writing your email…
                </p>
              )}
              {(body || subject) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subject-out">Suggested subject</Label>
                    <Input
                      id="subject-out"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body-out">Email body</Label>
                    <Textarea
                      id="body-out"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={18}
                      className="font-sans leading-relaxed"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
