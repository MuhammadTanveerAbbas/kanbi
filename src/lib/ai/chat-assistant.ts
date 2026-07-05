import Groq from 'groq-sdk';
import { truncateChatResponse } from '@/lib/chat-text';
import { GROQ_API_KEY, GROQ_MODEL } from '@/lib/constants';
import { logger } from '@/lib/logging/logger';

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

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

/** AI-powered chat assistant with full board context awareness. */
export class ChatAssistant {
  static async generateResponse(
    userMessage: string,
    context: ChatContext,
    chatHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      if (!groq) throw new Error('Groq API key not configured');

      const systemPrompt = this.buildSystemPrompt(context);
      const historyMessages = chatHistory.slice(-6).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.message,
      }));

      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.35,
        max_tokens: 120,
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content?.trim() ?? '';
      if (!raw) throw new Error('Empty AI response');
      return truncateChatResponse(raw);
    } catch (error) {
      logger.error('Chat assistant error:', { error });
      return truncateChatResponse(this.getFallbackResponse(userMessage, context));
    }
  }

  private static buildSystemPrompt(context: ChatContext): string {
    const { tasks, workloadHealth, estimatedHours, completedToday } = context;
    const taskLines = this.formatTaskList(tasks);

    return `You are Kanbi, a sharp productivity coach inside a task board app.

Board snapshot:
- Pending tasks: ${tasks.filter(t => t.status !== 'done').length} of ${tasks.length}
- Workload health: ${workloadHealth ?? 'n/a'}/100
- Done today: ${completedToday ?? 0}

Tasks on board:
${taskLines}

Rules:
- Reply in 1-3 short sentences OR a tight bullet list (max 4 bullets)
- Max 60 words total
- Only mention real tasks from the board above
- Give one clear next action when possible
- No filler, no lectures, no em/en dashes
- No emojis unless the user asks for motivation
- Plain text only`;
  }

  private static formatTaskList(tasks: ChatTask[]): string {
    const pending = tasks
      .filter(t => t.status !== 'done')
      .slice(0, 10);

    if (pending.length === 0) return '- (none pending)';

    return pending
      .map(t => `- [${(t.priority ?? 'medium').toLowerCase()}] ${t.title}`)
      .join('\n');
  }

  private static getFallbackResponse(userMessage: string, context: ChatContext): string {
    const msg = userMessage.toLowerCase();
    const pending = context.tasks.filter(t => t.status !== 'done');
    const urgent = pending.filter(t => (t.priority ?? '').toLowerCase() === 'urgent');
    const high = pending.filter(t => (t.priority ?? '').toLowerCase() === 'high');
    const top = urgent.length > 0 ? urgent : high;

    if (msg.includes('first') || msg.includes('start') || msg.includes('priorit')) {
      if (top.length > 0) {
        return `Start with "${top[0]!.title}"${top[1] ? `, then "${top[1].title}"` : ''}. Tackle urgent work first.`;
      }
      return pending[0]
        ? `Start with "${pending[0].title}". One task at a time.`
        : 'Your board is clear. Add tasks or review what is done.';
    }

    if (msg.includes('overwhelm') || msg.includes('too much') || msg.includes('stressed') || msg.includes('burnout')) {
      if (pending.length > 8) {
        return `You have ${pending.length} open tasks. Pick the top 3 for today and defer the rest.`;
      }
      return 'Focus on one small win first. Momentum beats a long list.';
    }

    if (msg.includes('break') && (msg.includes('down') || msg.includes('task'))) {
      const target = top[0] ?? pending[0];
      return target
        ? `Break "${target.title}" into 3 steps: prep, do, review. Want me to list them?`
        : 'Tell me which task to break down.';
    }

    if (msg.includes('plan') || msg.includes('schedule')) {
      return pending.length > 0
        ? `Plan: urgent/high first (${top.length || high.length} items), then medium. ${pending.length} tasks left.`
        : 'Nothing pending. Good time to plan tomorrow or clear inbox.';
    }

    if (msg.includes('motivat') || msg.includes('stuck')) {
      return 'Pick the smallest task and finish it in 10 minutes. Progress unlocks the next step.';
    }

    return pending.length > 0
      ? `You have ${pending.length} open tasks. Ask me to prioritize, plan, or break one down.`
      : 'Board looks clear. I can help plan your next batch of work.';
  }

  static async handleQuickAction(
    action: 'prioritize' | 'breakdown' | 'defer' | 'plan' | 'motivate',
    context: ChatContext
  ): Promise<string> {
    const { tasks } = context;
    const pending = tasks.filter(t => t.status !== 'done');
    const urgent = pending.filter(t => (t.priority ?? '').toLowerCase() === 'urgent');
    const high = pending.filter(t => (t.priority ?? '').toLowerCase() === 'high');

    switch (action) {
      case 'prioritize':
        if (urgent.length > 0) {
          return truncateChatResponse(
            `Do "${urgent[0]!.title}" first. Then ${high[0]?.title ?? 'medium tasks'}. ${urgent.length} urgent, ${high.length} high.`
          );
        }
        return high.length > 0
          ? `Start with "${high[0]!.title}". ${high.length} high-priority items waiting.`
          : 'No urgent/high tasks. Work medium items or clear quick wins.';

      case 'breakdown':
        return pending[0]
          ? `For "${pending[0].title}": define outcome, list 3 steps, timebox each.`
          : 'Add a task first, then I can break it down.';

      case 'defer': {
        const low = pending.filter(t => {
          const p = (t.priority ?? '').toLowerCase();
          return p === 'low' || p === 'medium';
        });
        if (low.length > 0) {
          return truncateChatResponse(
            `Defer to tomorrow: ${low.slice(0, 3).map(t => t.title).join(', ')}.`
          );
        }
        return 'Already on high-priority work. Defer anything non-urgent manually.';
      }

      case 'plan':
        return truncateChatResponse(
          `Morning: urgent/high (${urgent.length + high.length}). Afternoon: medium. ~${context.estimatedHours ?? pending.length}h total.`
        );

      case 'motivate':
        return (context.completedToday ?? 0) > 0
          ? `${context.completedToday} done today. Keep going with the next highest priority.`
          : 'One finished task changes the day. Start with the smallest item.';

      default:
        return 'Ask me to prioritize, plan, or break down a task.';
    }
  }

  static isBreakdownRequest(message: string): boolean {
    const msg = message.toLowerCase();
    return (msg.includes('break') && msg.includes('down')) ||
           msg.includes('split') ||
           msg.includes('subtask');
  }

  static extractTaskName(message: string, tasks: ChatTask[]): string | null {
    const quotedMatch = message.match(/"([^"]+)"/);
    if (quotedMatch) return quotedMatch[1] ?? null;

    const breakdownMatch = message.match(/break\s+down\s+(.+?)(?:\s+into|\s+task|$)/i);
    if (breakdownMatch) {
      const potentialName = breakdownMatch[1]!.trim();
      const matchingTask = tasks.find(t =>
        t.title.toLowerCase().includes(potentialName.toLowerCase())
      );
      return matchingTask?.title || potentialName;
    }

    return null;
  }
}
