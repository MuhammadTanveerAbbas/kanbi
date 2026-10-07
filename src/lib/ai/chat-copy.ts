/**
 * Chat copy.
 *
 * All text the assistant shows a user lives here, separated from the logic that
 * decides which line to use. Two reasons:
 *
 *   1. The wording can be reviewed and improved without touching control flow.
 *   2. A fitness check can verify that none of it uses punctuation the product
 *      does not publish, which is impossible to do from a class body.
 *
 * Tone rules for everything in this file:
 *   - Short. One idea per sentence.
 *   - Concrete. Name the actual task, not the category.
 *   - No em dashes, no en dashes, and no semicolons.
 *   - Never claim certainty about the future or about the user's feelings.
 */

export const CHAT_SYSTEM_PROMPT = `You are Kanbi, a productivity coach inside a task board.

Board snapshot:
- Pending tasks: PENDING of TOTAL
- Workload health: HEALTH out of 100
- Completed today: DONE

Tasks on the board:
TASKS

How to reply:
- Lead with the answer. No preamble, no restating the question.
- Two or three short sentences, or up to four bullets.
- Under 60 words.
- Name real tasks from the board above. Never invent a task.
- Give one clear next action whenever you can.
- Say so plainly when you do not have enough information.
- Plain text only. No markdown headings.
- No em dashes, no en dashes, and no semicolons.
- No emojis unless the user asks for motivation.`;

/** Lines used when the assistant cannot reach a model. */
export const FALLBACK_RESPONSES = {
  emptyBoard:
    'Your board is clear. Add a task, or paste a note and I will break it into tasks for you.',
  clearFirst:
    'Nothing is competing for your attention right now. Good time to plan the next batch.',
  prioritise: (urgent: string[], high: string[]): string => {
    if (urgent.length > 0) {
      const first = urgent[0]!;
      const second = urgent[1] ?? high[0];
      return second
        ? `Start with "${first}", then "${second}". Those are your urgent items.`
        : `Start with "${first}". It is the only urgent item on the board.`;
    }
    if (high.length > 0) {
      return `Start with "${high[0]!}". Nothing is marked urgent, so take the high priority items first.`;
    }
    return 'No urgent or high priority tasks. Work through the medium ones, or clear a quick win.';
  },
  overloaded: (openCount: number): string =>
    openCount > 8
      ? `You have ${openCount} open tasks. Pick three for today and move the rest to tomorrow. A finished day beats a planned one.`
      : 'Pick the smallest task on the board and finish it in ten minutes. Momentum beats a long list.',
  breakdown: (title: string): string =>
    `Break "${title}" into three steps: the outcome, the smallest first action, and what "done" looks like.`,
  breakdownNeedTask: 'Tell me which task to break down, or ask for your highest priority one.',
  plan: (urgent: number, high: number, total: number): string =>
    `Morning: the ${urgent + high} urgent and high priority items. Afternoon: everything else. ${total} tasks in total.`,
  planClear: 'Nothing pending. Good time to plan tomorrow or clear your inbox.',
  motivate: (done: number): string =>
    done > 0
      ? `${done} done today. Take the next highest priority and keep the streak going.`
      : 'Finish one task. That single change is enough to change how the rest of the day feels.',
  genericOpen: (openCount: number): string =>
    `You have ${openCount} open tasks. Ask me to prioritise, plan, or break one down.`,
  genericClear: 'Your board looks clear. I can help you plan the next batch of work.',
  noContext: 'I do not have enough on the board to answer that. Add a task or two and ask again.',
  /**
   * Used when no model runtime is configured at all.
   *
   * Distinct from `errored` because the cause is not transient. Telling someone
   * to "try again in a moment" when the deployment has no runtime is a
   * instruction that cannot succeed, and it is the kind of thing that erodes
   * trust in every other message.
   */
  unconfigured:
    'I am running without a model, so I can only answer from your board. Ask me to prioritise, plan, or break something down and I will.',

  errored:
    'I could not reach the assistant just now. Try again in a moment, or ask me to prioritise and I will answer from your board alone.',
  quickActionHint: 'Pick one of the shortcuts above, or ask in your own words.',
} as const;

/** Short labels for the quick action buttons. */
export const QUICK_ACTIONS = [
  { id: 'prioritize', label: 'Prioritise', hint: 'What should I do first?' },
  { id: 'breakdown', label: 'Break down', hint: 'Split a task into steps' },
  { id: 'plan', label: 'Plan today', hint: 'How should I sequence the day?' },
  { id: 'defer', label: 'Defer', hint: 'What can wait?' },
  { id: 'motivate', label: 'Motivate', hint: 'I am stuck' },
] as const;

export type QuickActionId = (typeof QUICK_ACTIONS)[number]['id'];

/** Greeting shown when the chat has no messages yet. */
export const CHAT_EMPTY_STATE = {
  title: 'Ask about your board',
  body: 'I can see every task you have. Ask what to do first, how to break something down, or what to defer.',
  examples: [
    'What should I start with?',
    'Break down my top task',
    'How should I plan today?',
    'What can I defer to tomorrow?',
  ],
} as const;

/**
 * Error lines shown in the thread.
 *
 * Each one says what happened and what the user can do, and none of them
 * apologise on behalf of the system. The technical detail stays in the server
 * log where it belongs.
 */
export const CHAT_ERRORS = {
  rateLimited:
    'I could not answer just now because you have reached the request limit. Try again in a minute, or upgrade for a higher limit.',
  offline:
    'I could not reach the server. Check your connection and try again.',
  empty: 'I did not get a reply back. Try asking that again.',
  generic: 'Something went wrong on my side. Try again in a moment.',
} as const;
