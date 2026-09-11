import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Copy, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, ResponsibleAiNote } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planSchedule, type PlannerResult } from "@/lib/ai.functions";
import { store, useAppState, type Priority } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner & Scheduler | Workplace AI" },
      {
        name: "description",
        content:
          "Add your tasks with priorities and deadlines and get a realistic daily or weekly schedule built around your working hours.",
      },
      { property: "og:title", content: "AI Task Planner & Scheduler | Workplace AI" },
      {
        property: "og:description",
        content: "Turn a task list into a realistic, prioritised schedule.",
      },
    ],
  }),
  component: PlannerPage,
});

const priorityTone: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/15 text-warning-foreground",
  Low: "bg-success/15 text-success-foreground",
};

function PlannerPage() {
  const plan = useServerFn(planSchedule);
  const { tasks } = useAppState();

  const [name, setName] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");

  const [workingHours, setWorkingHours] = useState("09:00 - 17:00");
  const [planDate, setPlanDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<"Daily" | "Weekly">("Daily");

  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);

  function addTask() {
    if (!name.trim()) {
      toast.error("Give the task a name first.");
      return;
    }
    store.addTask({ name: name.trim(), priority, duration, deadline });
    setName("");
    setDuration("");
    setDeadline("");
  }

  async function run() {
    const open = tasks.filter((t) => !t.done);
    if (open.length === 0) {
      toast.error("Add at least one task to plan.");
      return;
    }
    setLoading(true);
    try {
      const res = await plan({
        data: {
          tasks: open.map((t) => ({
            name: t.name,
            priority: t.priority,
            duration: t.duration,
            deadline: t.deadline,
          })),
          workingHours,
          planDate,
          mode,
        },
      });
      setResult({ blocks: res.blocks ?? [], explanation: res.explanation ?? "" });
      store.logActivity("Task Planner", `${mode} plan for ${open.length} tasks`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The schedule could not be created.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPlan() {
    if (!result) return;
    const text = result.blocks
      .map((b) => `${b.day} ${b.start}-${b.end} · ${b.task} (${b.priority}, ${b.duration})`)
      .join("\n");
    await navigator.clipboard.writeText(`${text}\n\n${result.explanation}`);
    toast.success("Schedule copied to your clipboard.");
  }

  return (
    <AppShell
      title="Task Planner & Scheduler"
      description="Turn your task list into a realistic, prioritised schedule."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task</Label>
              <Input
                id="task-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prepare quarterly report"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-duration">Duration</Label>
                <Input
                  id="task-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="1h 30m"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-deadline">Deadline</Label>
                <Input
                  id="task-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={addTask} variant="outline" className="w-full">
              <Plus className="size-4" /> Add task
            </Button>

            <div className="space-y-2 pt-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks added yet.</p>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 rounded-xl border border-border p-3"
                  >
                    <Checkbox
                      checked={t.done}
                      onCheckedChange={() => store.toggleTask(t.id)}
                      className="mt-0.5"
                      aria-label={`Mark ${t.name} done`}
                    />
                    <div className="min-w-0 flex-1">
                      <Input
                        value={t.name}
                        onChange={(e) => store.updateTask(t.id, { name: e.target.value })}
                        className={`h-8 border-0 px-0 shadow-none focus-visible:ring-0 ${
                          t.done ? "text-muted-foreground line-through" : ""
                        }`}
                      />
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={priorityTone[t.priority]} variant="secondary">
                          {t.priority}
                        </Badge>
                        <span>{t.duration || "Duration not specified"}</span>
                        <span>·</span>
                        <span>{t.deadline || "No deadline"}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => store.removeTask(t.id)}
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Planning settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="hours">Working hours</Label>
                <Input
                  id="hours"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="09:00 - 17:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-date">Start date</Label>
                <Input
                  id="plan-date"
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Plan type</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as "Daily" | "Weekly")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3 flex flex-wrap gap-2">
                <Button onClick={run} disabled={loading}>
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CalendarClock className="size-4" />
                  )}
                  {result ? "Regenerate schedule" : "Generate schedule"}
                </Button>
                {result && (
                  <>
                    <Button variant="outline" onClick={run} disabled={loading}>
                      <RefreshCw className="size-4" /> Try again
                    </Button>
                    <Button variant="outline" onClick={copyPlan}>
                      <Copy className="size-4" /> Copy
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.blocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No schedule blocks were returned. Try adding durations to your tasks.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {result.blocks.map((b, i) => (
                      <li
                        key={`${b.task}-${i}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border p-3"
                      >
                        <span className="font-mono text-sm font-semibold">
                          {b.start} – {b.end}
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-medium">{b.task}</span>
                        <Badge variant="secondary" className={priorityTone[b.priority]}>
                          {b.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {b.day} · {b.duration} · due {b.deadline}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                {result.explanation && (
                  <div className="rounded-xl bg-primary-soft p-4 text-sm leading-relaxed">
                    <p className="mb-1 font-semibold">Why this order</p>
                    {result.explanation}
                  </div>
                )}
                <ResponsibleAiNote />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
