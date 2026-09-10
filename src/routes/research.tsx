import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Eraser, Info, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, ResponsibleAiNote } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runResearch, type ResearchResult } from "@/lib/ai.functions";
import { store } from "@/lib/store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | Workplace AI" },
      {
        name: "description",
        content:
          "Research any work topic: summary, key insights, opportunities, risks, recommendations and follow-up questions.",
      },
      { property: "og:title", content: "AI Research Assistant | Workplace AI" },
      {
        property: "og:description",
        content: "Structured research briefs without fabricated sources.",
      },
    ],
  }),
  component: ResearchPage,
});

const SECTIONS: { key: keyof ResearchResult; label: string }[] = [
  { key: "insights", label: "Key insights" },
  { key: "considerations", label: "Important considerations" },
  { key: "opportunities", label: "Opportunities" },
  { key: "risks", label: "Risks & limitations" },
  { key: "recommendations", label: "Recommendations" },
  { key: "followUps", label: "Follow-up questions" },
];

function ResearchPage() {
  const research = useServerFn(runResearch);
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [source, setSource] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!topic.trim()) {
      toast.error("Enter a research topic first.");
      return;
    }
    setLoading(true);
    try {
      const out = await research({ data: { topic, question, source } });
      setResult({
        basis: out.basis ?? "",
        summary: out.summary ?? "",
        insights: out.insights ?? [],
        considerations: out.considerations ?? [],
        opportunities: out.opportunities ?? [],
        risks: out.risks ?? [],
        recommendations: out.recommendations ?? [],
        followUps: out.followUps ?? [],
      });
      store.logActivity("Research Assistant", topic.slice(0, 60));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The research could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    if (!result) return;
    const text = [
      `Topic: ${topic}`,
      question ? `Question: ${question}` : "",
      "",
      result.basis,
      "",
      "SUMMARY",
      result.summary,
      ...SECTIONS.flatMap(({ key, label }) => {
        const items = result[key] as string[];
        return ["", label.toUpperCase(), ...(items.length ? items.map((i) => `- ${i}`) : ["- Not specified"])];
      }),
    ]
      .filter((line) => line !== undefined)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Research copied to your clipboard.");
  }

  function updateSection(key: keyof ResearchResult, index: number, value: string) {
    if (!result) return;
    const items = [...(result[key] as string[])];
    items[index] = value;
    setResult({ ...result, [key]: items });
  }

  function clearAll() {
    setTopic("");
    setQuestion("");
    setSource("");
    setResult(null);
  }

  return (
    <AppShell
      title="AI Research Assistant"
      description="Structured briefs for decisions, proposals and study"
      children={
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What are you researching?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topic">Research topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Hybrid work policies for support teams"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question">Specific question</Label>
                  <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What should we watch out for in the first quarter?"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Article or text to work from (optional)</Label>
                <Textarea
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  rows={8}
                  placeholder="Paste an article, report extract or internal document. The assistant will summarise this material instead of relying on general knowledge."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={run} disabled={loading}>
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Research
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
                <Loader2 className="size-4 animate-spin" /> Preparing your brief…
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-5">
              {result.basis && (
                <div className="flex gap-3 rounded-2xl border border-border bg-primary-soft p-4 text-sm">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="leading-relaxed text-foreground/80">{result.basis}</p>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Topic summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={result.summary}
                    onChange={(e) => setResult({ ...result, summary: e.target.value })}
                    rows={6}
                  />
                </CardContent>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                {SECTIONS.map(({ key, label }) => {
                  const items = result[key] as string[];
                  return (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-base">{label}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {items.length === 0 && (
                          <p className="text-sm text-muted-foreground">Not specified.</p>
                        )}
                        {items.map((item, i) => (
                          <Textarea
                            key={i}
                            value={item}
                            rows={2}
                            onChange={(e) => updateSection(key, i, e.target.value)}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
