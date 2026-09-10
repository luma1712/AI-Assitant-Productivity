import { useEffect, useState } from "react";

export type Priority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  name: string;
  priority: Priority;
  duration: string;
  deadline: string;
  done: boolean;
};

export type Activity = {
  id: string;
  tool: string;
  label: string;
  at: number;
};

type State = { tasks: Task[]; activity: Activity[] };

const KEY = "awpa-state-v1";

let state: State = { tasks: [], activity: [] };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  persist();
  emit();
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const store = {
  addTask(task: Omit<Task, "id" | "done">) {
    set({ tasks: [...state.tasks, { ...task, id: uid(), done: false }] });
  },
  updateTask(id: string, patch: Partial<Task>) {
    set({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  },
  removeTask(id: string) {
    set({ tasks: state.tasks.filter((t) => t.id !== id) });
  },
  toggleTask(id: string) {
    set({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  },
  logActivity(tool: string, label: string) {
    const entry: Activity = { id: uid(), tool, label, at: Date.now() };
    set({ activity: [entry, ...state.activity].slice(0, 12) });
  },
  clearActivity() {
    set({ activity: [] });
  },
};

export function useAppState(): State {
  const [snapshot, setSnapshot] = useState<State>(state);

  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) state = { ...state, ...(JSON.parse(raw) as State) };
      } catch {
        /* ignore malformed storage */
      }
    }
    const listener = () => setSnapshot({ ...state });
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return snapshot;
}

export function timeAgo(at: number) {
  const seconds = Math.floor((Date.now() - at) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
