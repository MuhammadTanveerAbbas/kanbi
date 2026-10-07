/**
 * Board aware chat assistant.
 *
 * The assistant is a thin layer over two things:
 *
 *   1. A language model, which reads the board and the question and writes a
 *      short reply. This is the only part that is probabilistic.
 *   2. Deterministic rules, which answer the common questions directly from the
 *      board. These are not a fallback bolted on afterwards. Asking "what should
 *      I do first" is arithmetic over a list, so it is computed, not generated.
 *
 * Every reply passes through the prose normaliser before it leaves this file, so
 * no dash punctuation or semicolon can reach the interface.
 */

import { normalizeChatReply, normalizeLine } from '@/lib/text/normalize';
import { complete, isInferenceConfigured } from '@/lib/ai/service';
import { logger } from '@/lib/logging/logger';
import { CHAT_SYSTEM_PROMPT, FALLBACK_RESPONSES, type QuickActionId } from '@/lib/ai/chat-copy';

export type { QuickActionId } from '@/lib/ai/chat-copy';

export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
}

export interface ChatTask {
  id?: string;
  title: string;
  priority?: string;
  status?: string;
}

export interface ChatContext {
  tasks: ChatTask[];
  workloadHealth?: number;
  estimatedHours?: number;
  completedToday?: number;
}

/** How many prior turns are sent to the model. */
const HISTORY_TURNS = 6;
/** Cap on a model reply, in characters. */
const MAX_REPLY_CHARS = 320;
/** How many tasks are described to the model. */
const MAX_TASKS_IN_PROMPT = 20;

function priorityOf(task: ChatTask): string {
  return (task.priority ?? 'medium').toLowerCase();
}

function isOpen(task: ChatTask): boolean {
  return (task.status ?? '').toLowerCase() !== 'done';
}

/** Partitions open tasks by priority, which most answers are built from. */
function partition(tasks: ChatTask[]): { open: ChatTask[]; urgent: ChatTask[]; high: ChatTask[] } {
  const open = (tasks ?? []).filter((t) => t && typeof t.title === 'string' && isOpen(t));
  return {
    open,
    urgent: open.filter((t) => priorityOf(t) === 'urgent'),
    high: open.filter((t) => priorityOf(t) === 'high'),
  };
}

function titles(list: ChatTask[]): string[] {
  return list.map((t) => normalizeLine(t.title));
}

/** Builds the task list the model is allowed to refer to. */
function formatTaskList(tasks: ChatTask[]): string {
  const open = (tasks ?? []).filter((t) => t && typeof t.title === 'string' && isOpen(t));
  if (open.length === 0) return '- (no open tasks)';
  return open
    .slice(0, MAX_TASKS_IN_PROMPT)
    .map((t) => `- [${priorityOf(t)}] ${normalizeLine(t.title)}`)
    .join('\n');
}

function buildSystemPrompt(context: ChatContext): string {
  const all = context.tasks ?? [];
  const { open } = partition(all);
  return CHAT_SYSTEM_PROMPT.replace('PENDING of TOTAL', `${open.length} of ${all.length}`)
    .replace('HEALTH out of 100', String(context.workloadHealth ?? 'unknown'))
    .replace('DONE', String(context.completedToday ?? 0))
    .replace('TASKS', formatTaskList(all));
}

export class ChatAssistant {
  /**
   * Answers a question about the board.
   *
   * The model is used when there is something to reason about. When the message
   * is a common question with a computable answer, the deterministic path runs
   * first, so the answer is consistent and instant.
   */
  static async generateResponse(
    userMessage: string,
    context: ChatContext,
    chatHistory: ChatMessage[] = []
  ): Promise<string> {
    const question = normalizeLine(userMessage ?? '');

    if (question.length === 0) return FALLBACK_RESPONSES.noContext;

    const direct = this.answerFromBoard(question, context);
    if (direct) return direct;

    try {
      if (!isInferenceConfigured()) throw new Error('Inference is not configured');

      const historyMessages = chatHistory
        .slice(-HISTORY_TURNS)
        .map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: normalizeChatReply(msg.message, MAX_REPLY_CHARS),
        }));

      const result = await complete({
        temperature: 0.4,
        maxTokens: 220,
        messages: [
          { role: 'system', content: buildSystemPrompt(context) },
          ...historyMessages,
          { role: 'user', content: question },
        ],
      });

      const raw = result.content.trim();
      if (!raw) throw new Error('Empty assistant response');
      return normalizeChatReply(raw, MAX_REPLY_CHARS);
    } catch (error) {
      logger.error('Assistant error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // A missing runtime is a different situation from a runtime that failed,
      // and the two need different words. "Try again in a moment" is a
      // reasonable instruction when a server hiccuped and a misleading one when
      // nothing is listening.
      return isInferenceConfigured()
        ? FALLBACK_RESPONSES.errored
        : FALLBACK_RESPONSES.unconfigured;
    }
  }

  /**
   * Answers a recognised question directly from the board.
   *
   * Returns null when the question is not one these rules cover, which tells
   * the caller to use the model instead.
   */
  private static answerFromBoard(question: string, context: ChatContext): string | null {
    const { open, urgent, high } = partition(context.tasks ?? []);

    if (open.length === 0) {
      return FALLBACK_RESPONSES.emptyBoard;
    }

    if (/^(\W*)(what|which|who).{0,12}\b(first|start|begin|next|now)\b/.test(question)) {
      return FALLBACK_RESPONSES.prioritise(titles(urgent), titles(high));
    }

    if (/\b(priorit|prioriti|triage)\w*\b/.test(question)) {
      return FALLBACK_RESPONSES.prioritise(titles(urgent), titles(high));
    }

    if (/\b(overwhelm|too much|stressed|burn ?out|behind|swamped)\b/.test(question)) {
      return FALLBACK_RESPONSES.overloaded(open.length);
    }

    if (/\b(break|split|chunk|sub ?task)\w*\b/.test(question)) {
      const target = urgent[0] ?? high[0] ?? open[0];
      return target
        ? FALLBACK_RESPONSES.breakdown(normalizeLine(target.title))
        : FALLBACK_RESPONSES.breakdownNeedTask;
    }

    if (/\b(plan|schedule|sequence|order|today)\b/.test(question)) {
      return FALLBACK_RESPONSES.plan(urgent.length, high.length, open.length);
    }

    if (/\b(motivat|stuck|procrastinat|lazy|tired)\b/.test(question)) {
      return FALLBACK_RESPONSES.motivate(context.completedToday ?? 0);
    }

    if (/\b(defer|later|postpone|skip|drop)\b/.test(question)) {
      const deferrable = open.filter((t) => {
        const p = priorityOf(t);
        return p === 'low' || p === 'medium';
      });
      if (deferrable.length === 0) {
        return 'Everything open is urgent or high priority. Nothing is safe to defer today.';
      }
      const names = titles(deferrable).slice(0, 3);
      return `Safe to move to tomorrow: ${names.join(', ')}.`;
    }

    return null;
  }

  /**
   * Runs a quick action. Every one of these is arithmetic over the board, so
   * none of them uses a model.
   */
  static handleQuickAction(action: QuickActionId, context: ChatContext): string {
    const { open, urgent, high } = partition(context.tasks ?? []);

    if (open.length === 0) return FALLBACK_RESPONSES.emptyBoard;

    switch (action) {
      case 'prioritize':
        return FALLBACK_RESPONSES.prioritise(titles(urgent), titles(high));

      case 'breakdown': {
        const target = urgent[0] ?? high[0] ?? open[0];
        return target
          ? FALLBACK_RESPONSES.breakdown(normalizeLine(target.title))
          : FALLBACK_RESPONSES.breakdownNeedTask;
      }

      case 'plan':
        return FALLBACK_RESPONSES.plan(urgent.length, high.length, open.length);

      case 'defer': {
        const deferrable = open.filter((t) => {
          const p = priorityOf(t);
          return p === 'low' || p === 'medium';
        });
        if (deferrable.length === 0) {
          return 'Everything open is urgent or high priority. Nothing is safe to defer today.';
        }
        return `Safe to move to tomorrow: ${titles(deferrable).slice(0, 3).join(', ')}.`;
      }

      case 'motivate':
        return FALLBACK_RESPONSES.motivate(context.completedToday ?? 0);

      default:
        return FALLBACK_RESPONSES.quickActionHint;
    }
  }

  /** True when the user is asking for a task to be split up. */
  static isBreakdownRequest(message: string): boolean {
    const msg = (message ?? '').toLowerCase();
    return /\b(break|split|chunk)\w*\b/.test(msg) || msg.includes('subtask');
  }

  /** Reads a task name out of a message, for example the one inside quotes. */
  static extractTaskName(message: string, tasks: ChatTask[]): string | null {
    const text = message ?? '';
    const quoted = text.match(/["']([^"']{3,})["']/);
    if (quoted) return normalizeLine(quoted[1]!);

    const requested = text.match(/(?:break|split|chunk)\w*\s+(.+?)(?:\s+into|\s+into steps|\?|$)/i);
    if (requested) {
      const name = normalizeLine(requested[1]!);
      if (!name) return null;
      const match = (tasks ?? []).find((t) =>
        normalizeLine(t.title).toLowerCase().includes(name.toLowerCase())
      );
      return match ? normalizeLine(match.title) : name;
    }
    return null;
  }

  /** Summary of the board used by the chat header. */
  static describeBoard(context: ChatContext): string {
    const { open, urgent } = partition(context.tasks ?? []);
    if (open.length === 0) return 'No open tasks';
    const urgentPart = urgent.length > 0 ? `, ${urgent.length} urgent` : '';
    return `${open.length} open${urgentPart}`;
  }
}
