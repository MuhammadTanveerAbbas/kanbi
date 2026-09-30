"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Page = "overview" | "board" | "chat" | "autopilot" | "saved" | "settings";
export type Priority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "wip" | "done";
export type Theme = "dark" | "light";
export type InputMode = "paste" | "url" | "pdf" | "template";
export type BoardView = "input" | "kanban";

export interface Task {
  id: string; title: string; priority: Priority;
  label: string; dueDate?: string; estimate?: string;
  status: TaskStatus;
}
export interface SavedBoard {
  id: string; name: string; taskCount: number;
  folder: string; lastEdited: string; tasks: Task[];
}
export interface ChatMsg { id: string; role: "user" | "ai"; content: string; ts: string; }
export interface Briefing {
  id: string;
  date: string;
  summary: string;
  /** Every field is a string. Produced by normalizeBriefingResponse. */
  schedule: { time: string; task: string; duration: string }[];
  healthNote: string;
  /** Short motivational line from the engine, may be empty. */
  quote?: string;
  /** Top tasks with the reason each was chosen. */
  priorities?: { task: string; reason: string }[];
  /** All warnings, not just the first. */
  warnings?: string[];
}
export interface BurnoutAlert { id: string; date: string; score: number; message: string; }
export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan?: "free" | "pro";
  boards_used_today?: number;
  ai_uses_this_month?: number;
  /**
   * The limits for the current plan, taken from the server response rather than
   * hardcoded in the interface. The dashboard previously hardcoded 10 and 50,
   * which disagreed with the enforced values and misreported the plan.
   */
  boards_today_limit?: number;
  boards_month_limit?: number;
  ai_today_limit?: number;
  ai_month_limit?: number;
}

export interface AppState {
  tasks: Task[];
  setTasks: (t: Task[] | ((p: Task[]) => Task[])) => void;
  savedBoards: SavedBoard[];
  setSavedBoards: (b: SavedBoard[] | ((p: SavedBoard[]) => SavedBoard[])) => void;
  chatMessages: ChatMsg[];
  setChatMessages: (m: ChatMsg[] | ((p: ChatMsg[]) => ChatMsg[])) => void;
  briefings: Briefing[];
  setBriefings: (b: Briefing[] | ((p: Briefing[]) => Briefing[])) => void;
  burnoutAlerts: BurnoutAlert[];
  dailyGoal: number; weeklyGoal: number;
  boardView: BoardView; setBoardView: (v: BoardView) => void;
  navigate: (p: Page) => void;
  user: AuthUser | null;
  isLoading: boolean;
}

export const AppCtx = createContext<AppState>({} as AppState);
export const useApp = () => useContext(AppCtx);
