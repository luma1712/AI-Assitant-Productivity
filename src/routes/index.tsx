import { Link, createFileRoute } from "@tanstack/react-router";

import profilePhoto from "@/assets/kim-avatar.png.asset.json";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Circle,
  ClipboardList,
  Lightbulb,
  Mail,
  MessagesSquare,
  NotebookPen,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { AppShell, ResponsibleAiNote } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { store, timeAgo, useAppState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workplace AI Dashboard | Productivity Assistant" },
      {
        name: "description",
        content:
          "Your AI workplace dashboard: draft email, summarise meetings, plan your day and research topics from one place.",
      },
      { property: "og:title", content: "Workplace AI Dashboard | Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Draft email, summarise meetings, plan your day and research topics with one AI workplace assistant.",
      },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  { to: "/email", label: "Generate Email", hint: "Professional drafts in seconds", icon: Mail },
  {
    to: "/meetings",
    label: "Summarize Meeting",
    hint: "Decisions and action items",
    icon: NotebookPen,
  },
  { to: "/planner", label: "Plan My Day", hint: "Realistic AI schedule", icon: CalendarCheck },
  { to: "/research", label: "Research Topic", hint: "Insights and risks", icon: Search },
  { to: "/chat", label: "Ask AI", hint: "Chat with your assistant", icon: MessagesSquare },
] as const;

function Dashboard() {
  const { tasks, activity } = useAppState();
  const done = tasks.filter((t) => t.done).length;
  const open = tasks.length - done;
  const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const highPriority = tasks.filter((t) => !t.done && t.priority === "High").length;

  const stats = [
    { label: "Tasks planned", value: tasks.length, icon: ClipboardList },
    { label: "Completed", value: done, icon: CheckCircle2 },
    { label: "AI actions", value: activity.length, icon: Sparkles },
    { label: "High priority open", value: highPriority, icon: TrendingUp },
  ];

  const insights = [
    tasks.length === 0
      ? "Add a few tasks in the Task Planner and the AI will build a realistic schedule around your working hours."
      : `You have ${open} open task${open === 1 ? "" : "s"} and ${completion}% of today's plan is complete.`,
    highPriority > 0
      ? `${highPriority} high-priority task${highPriority === 1 ? "" : "s"} still need${highPriority === 1 ? "s" : ""} a slot — tackle those in your first focus block.`
      : "No high-priority work is outstanding, so this is a good window for deep or creative work.",
    activity.length === 0
      ? "Try the Smart Email Generator to see how much drafting time you can save on routine replies."
      : "Reuse your last summary in the chatbot to turn notes into a follow-up email in one step.",
  ];

  return (
    <AppShell
      title="Dashboard"
      description="Your AI workplace overview for today"
      children={
        <div className="space-y-6">
          <Card className="overflow-hidden border-none bg-primary text-primary-foreground shadow-lg">
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="max-w-xl space-y-2">
                <Badge className="border-none bg-primary-foreground/15 text-primary-foreground">
                  AI Workplace Productivity Assistant
                </Badge>
                <div className="flex items-center gap-3">
                  <img
                    src={profilePhoto.url}
                    alt="Profile photo of Kim Anesipho"
                    className="size-14 rounded-full object-cover ring-2 ring-primary-foreground/30"
                    loading="lazy"
                  />
                  <h2 className="text-2xl font-semibold sm:text-3xl">Welcome back, Kim</h2>
                </div>
                <p className="text-sm text-primary-foreground/80">
                  Automate the routine parts of your workday — drafting, summarising, planning and
                  researching — and keep your attention on the work that matters.
                </p>
              </div>
              <Button asChild variant="secondary" size="lg" className="self-start">
                <Link to="/planner">
                  Plan my day
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-2xl font-semibold">{value}</span>
                    <span className="block text-xs text-muted-foreground">{label}</span>
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quick actions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {QUICK_ACTIONS.map(({ to, label, hint, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="mt-3 block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Today's tasks</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {done}/{tasks.length || 0} done
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={completion} />
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks yet.{" "}
                    <Link to="/planner" className="font-medium text-primary hover:underline">
                      Add your first tasks
                    </Link>{" "}
                    and let the AI schedule them.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {tasks.slice(0, 6).map((task) => (
                      <li key={task.id} className="flex items-center gap-3 py-2.5">
                        <button
                          onClick={() => store.toggleTask(task.id)}
                          className="text-muted-foreground transition-colors hover:text-primary"
                          aria-label={task.done ? "Mark as not done" : "Mark as done"}
                        >
                          {task.done ? (
                            <CheckCircle2 className="size-5 text-success" />
                          ) : (
                            <Circle className="size-5" />
                          )}
                        </button>
                        <span
                          className={
                            task.done
                              ? "flex-1 text-sm text-muted-foreground line-through"
                              : "flex-1 text-sm"
                          }
                        >
                          {task.name}
                        </span>
                        <Badge variant={task.priority === "High" ? "default" : "secondary"}>
                          {task.priority}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Recent AI activity</CardTitle>
                {activity.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => store.clearActivity()}>
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Anything you generate will show up here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {activity.slice(0, 6).map((item) => (
                      <li key={item.id} className="flex gap-3">
                        <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                          <Sparkles className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{item.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {item.tool} · {timeAgo(item.at)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Lightbulb className="size-4 text-primary" />
              <CardTitle className="text-base">AI productivity insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {insights.map((insight) => (
                  <li key={insight} className="flex gap-2 text-sm text-foreground/80">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    {insight}
                  </li>
                ))}
              </ul>
              <ResponsibleAiNote className="border-t border-border pt-3" />
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
