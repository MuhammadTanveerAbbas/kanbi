"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Page = "overview" | "board" | "chat" | "autopilot" | "saved" | "settings";
export type Priority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "wip" | "done";
export type Theme = "dark" | "light";
export type InputMode = "paste" | "pdf" | "template";
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
  id: string; date: string; summary: string;
  schedule: { time: string; task: string; duration: string }[];
  healthNote: string;
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
