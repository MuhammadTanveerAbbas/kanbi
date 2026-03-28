import { AIService } from '@/lib/ai-service';
import { Task } from '@/lib/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
}

export interface ChatContext {
  tasks: Task[];
  workloadHealth?: number;
  estimatedHours?: number;
  completedToday?: number;
}

/** AI-powered chat assistant with full board context awareness. */
export class ChatAssistant {
  /**
   * Generates a response using the current task context and recent chat history.
   * Falls back to rule-based responses if the AI call fails.
   */
  static async generateResponse(
    userMessage: string,
    context: ChatContext,
    chatHistory: ChatMessage[] = []
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const conversationHistory = this.formatChatHistory(chatHistory);
    
    try {
      const response = await AIService.generate(
        `${systemPrompt}\n\n${conversationHistory}\n\nUser: ${userMessage}\n\nAssistant:`,
        { model: 'groq', tone: 'friendly', length: 'medium' }
      );
      
      return response.trim();
    } catch (error) {
      console.error('Chat assistant error:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private static buildSystemPrompt(context: ChatContext): string {
    const { tasks, workloadHealth, estimatedHours, completedToday } = context;
    
    const taskSummary = this.summarizeTasks(tasks);
    
    return `You are a helpful AI productivity assistant for KANBI, a task management app. You help users manage their workload, prioritize tasks, and stay productive.

Current Context:
- Total tasks: ${tasks.length}
- Task breakdown: ${taskSummary}
- Workload health: ${workloadHealth || 'calculating'}/100
- Estimated time: ${estimatedHours || 'calculating'} hours
- Completed today: ${completedToday || 0} tasks

Your role:
- Help users prioritize and plan their work
- Provide actionable suggestions
- Break down complex tasks into subtasks
- Offer encouragement and motivation
- Be concise, friendly, and helpful
- Reference specific tasks by name when relevant

Guidelines:
- Keep responses under 100 words
- Be specific and actionable
- Use emojis sparingly (1-2 per message)
- Don't make up tasks that don't exist
- Focus on productivity and well-being`;
  }

  private static summarizeTasks(tasks: Task[]): string {
    const urgent = tasks.filter(t => t.priority === 'Urgent').length;
    const high = tasks.filter(t => t.priority === 'High').length;
    const medium = tasks.filter(t => t.priority === 'Medium').length;
    const low = tasks.filter(t => t.priority === 'Low').length;
    
    return `${urgent} urgent, ${high} high, ${medium} medium, ${low} low`;
  }

  private static formatChatHistory(history: ChatMessage[]): string {
    const recentHistory = history.slice(-5);
    
    return recentHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.message}`)
      .join('\n');
  }

  /** Rule-based fallback responses when the AI call fails. */
  private static getFallbackResponse(userMessage: string, context: ChatContext): string {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('first') || msg.includes('start') || msg.includes('priorit')) {
      const urgentTasks = context.tasks.filter(t => t.priority === 'Urgent');
      if (urgentTasks.length > 0) {
        return `I recommend starting with your ${urgentTasks.length} urgent task${urgentTasks.length > 1 ? 's' : ''}: ${urgentTasks.slice(0, 2).map(t => `"${t.title}"`).join(', ')}. They need immediate attention.`;
      }
      return "Start with your highest priority tasks first. Focus on one thing at a time for best results.";
    }
    
    if (msg.includes('overwhelm') || msg.includes('too much') || msg.includes('stressed')) {
      if (context.tasks.length > 10) {
        return `I see you have ${context.tasks.length} tasks. That's a lot! Consider deferring low-priority tasks to tomorrow. Focus on the top 3-5 most important ones today.`;
      }
      return "Take a deep breath. Let's break this down into manageable chunks. What's the one thing you can accomplish right now?";
    }
    
    if (msg.includes('break') && (msg.includes('down') || msg.includes('task'))) {
      return "To break down a task: 1) Identify the end goal, 2) List all steps needed, 3) Estimate time for each step, 4) Create separate tasks for each step. What task would you like to break down?";
    }
    
    if (msg.includes('plan') || msg.includes('schedule')) {
      return `You have ${context.tasks.length} tasks today. I suggest: Start with urgent items, tackle high-priority tasks in your peak hours, and save low-priority tasks for when energy is lower.`;
    }
    
    if (msg.includes('motivat') || msg.includes('help') || msg.includes('stuck')) {
      return `You've got this! 💪 Start with the smallest task to build momentum. Completing even one task will make you feel accomplished and ready for the next.`;
    }
    
    return `I'm here to help with your ${context.tasks.length} tasks! Ask me to prioritize, break down tasks, plan your day, or just chat about your workload.`;
  }

  static async handleQuickAction(
    action: 'prioritize' | 'breakdown' | 'defer' | 'plan' | 'motivate',
    context: ChatContext
  ): Promise<string> {
    const { tasks } = context;
    
    switch (action) {
      case 'prioritize':
        const urgent = tasks.filter(t => t.priority === 'Urgent');
        const high = tasks.filter(t => t.priority === 'High');
        if (urgent.length > 0) {
          return `🎯 Priority Order:\n\n1. Start with ${urgent.length} urgent task${urgent.length > 1 ? 's' : ''}\n2. Then tackle ${high.length} high-priority task${high.length > 1 ? 's' : ''}\n3. Fill remaining time with medium tasks\n\nFocus on: "${urgent[0]?.title || high[0]?.title}" first!`;
        }
        return `🎯 Start with your ${high.length} high-priority tasks, then work through medium and low priority items.`;
      
      case 'breakdown':
        return `📋 To break down a task:\n\n1. Choose a complex task\n2. List all steps needed\n3. Estimate time per step\n4. Create separate tasks\n\nWhich task would you like me to help break down?`;
      
      case 'defer':
        const lowPriority = tasks.filter(t => t.priority === 'Low' || t.priority === 'Medium');
        if (lowPriority.length > 0) {
          return `📅 I suggest deferring these ${lowPriority.length} tasks to tomorrow:\n\n${lowPriority.slice(0, 3).map(t => `• ${t.title}`).join('\n')}\n\nThis will reduce your workload and help you focus on what matters most today.`;
        }
        return `You're already focused on high-priority work! Consider deferring any tasks that aren't urgent.`;
      
      case 'plan':
        const totalHours = context.estimatedHours || tasks.length * 1;
        return `📅 Daily Plan:\n\n⏰ Morning (9-12): Urgent & high-priority tasks\n☀️ Afternoon (1-4): Medium-priority tasks  \n🌙 Evening (4-6): Low-priority & admin tasks\n\nYou have ~${totalHours}h of work. Pace yourself and take breaks!`;
      
      case 'motivate':
        const completed = context.completedToday || 0;
        if (completed > 0) {
          return `🌟 You've already completed ${completed} task${completed > 1 ? 's' : ''} today! That's awesome progress. Keep the momentum going - you're doing great!`;
        }
        return `💪 You've got this! Every big accomplishment starts with the decision to try. Pick one task and start now. Small progress is still progress!`;
      
      default:
        return "I'm here to help! Ask me anything about your tasks.";
    }
  }

  static isBreakdownRequest(message: string): boolean {
    const msg = message.toLowerCase();
    return (msg.includes('break') && msg.includes('down')) || 
           msg.includes('split') || 
           msg.includes('subtask');
  }

  static extractTaskName(message: string, tasks: Task[]): string | null {
    const quotedMatch = message.match(/"([^"]+)"/);
    if (quotedMatch) {
      return quotedMatch[1];
    }
    const breakdownMatch = message.match(/break\s+down\s+(.+?)(?:\s+into|\s+task|$)/i);
    if (breakdownMatch) {
      const potentialName = breakdownMatch[1].trim();
      // Check if it matches any existing task
      const matchingTask = tasks.find(t => 
        t.title.toLowerCase().includes(potentialName.toLowerCase())
      );
      return matchingTask?.title || potentialName;
    }
    
    return null;
  }
}
