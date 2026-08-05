import Groq from 'groq-sdk';
import { logger } from '@/lib/logging/logger';
import { ExtractedTask, TaskExtractionResult, TaskDuplicate, ExtractionMetadata } from './types';
import { GROQ_API_KEY, GROQ_MODEL } from './constants';

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

export type AIModel = 'groq';

export interface GenerationOptions {
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  format?: 'text' | 'markdown' | 'json' | 'html';
  model?: AIModel;
}

/**
 * Robustly extract a JSON array from raw LLM output.
 * Strips markdown fences and reasoning tags (`<think>`, `thinking` blocks)
 * that some models emit around the payload, then finds the outermost array.
 */
export function extractJsonArray(raw: string): unknown[] {
  if (!raw) return [];
  let text = raw.trim();
  // Strip fenced blocks
  text = text.replace(/```(?:json)?/gi, '').trim();
  // Strip Groq reasoning/thinking blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/^\s*thinking\s*:[\s\S]*?\n/im, '').trim();

  const start = text.indexOf('[');
  if (start === -1) return [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(text.slice(start, i + 1));
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
    }
  }
  return [];
}

/** Unified AI service backed by Groq (llama-3.3-70b-versatile). */
export class AIService {
  /**
   * Generate content via Groq.
   * @param input - Prompt or user-provided text
   * @param options - Tone, length, format, and model overrides
   */
  static async generate(
    input: string,
    options: GenerationOptions = {}
  ): Promise<string> {
    const { tone = 'professional', length = 'medium', format = 'text' } = options;

    try {
      if (!groq) {
        throw new Error('Groq API key not configured');
      }
      return await this.generateWithGroq(input, tone, length, format);
    } catch (error) {
      logger.error('Error with Groq:', { error });
      throw error;
    }
  }

  private static async generateWithGroq(
    input: string,
    tone: string,
    length: string,
    format: string
  ): Promise<string> {
    if (!groq) {
      throw new Error('Groq API key not configured');
    }

    const lengthWords = length === 'short' ? '50-100' : length === 'medium' ? '100-300' : '300+';
    const formatInstruction = format === 'json'
      ? 'Return valid JSON only.'
      : format === 'markdown'
        ? 'Use markdown formatting.'
        : format === 'html'
          ? 'Return HTML formatted content.'
          : 'Return plain text.';

    const prompt = `You are a helpful AI assistant. Generate content based on the following input.\n\nInput: ${input}\n\nRequirements:\n- Tone: ${tone}\n- Length: ${lengthWords} words\n- Format: ${formatInstruction}\n\nGenerate the content now:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that generates high-quality content based on user requirements.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_MODEL,
      temperature: 0.7,
      max_tokens: length === 'short' ? 200 : length === 'medium' ? 500 : 1000,
    });

    return completion.choices[0]?.message?.content || '';
  }

  /** Coerce raw AI output into a consistent task shape. */
  private static normalizeTaskArray(raw: any[]): { task: string; owner: string; deadline: string; priority?: string }[] {
    if (!Array.isArray(raw)) return [];
    const mapped: (({ task: string; owner: string; deadline: string; priority: string } | null)[]) = raw.map((item: any) => {
      if (!item || typeof item !== 'object') return null;
      const task = (item.task ?? item.title ?? item.description ?? '').toString().trim();
      if (!task) return null;
      return {
        task,
        owner: (item.owner ?? item.assignee ?? 'Me').toString().trim(),
        deadline: (item.deadline ?? item.dueDate ?? item.due ?? 'Not specified').toString().trim(),
        priority: (item.priority ?? 'medium').toString().toLowerCase(),
      };
    });
    return mapped.filter((t: any): t is { task: string; owner: string; deadline: string; priority: string } => t !== null && t.task.length > 0) as { task: string; owner: string; deadline: string; priority?: string }[];
  }

  /**
   * Extract structured tasks from freeform notes using Groq.
   * Falls back to bullet-point parsing if the LLM call fails.
   */
  static async parseTasks(notes: string): Promise<TaskExtractionResult> {
    if (!notes || typeof notes !== 'string') {
      throw new Error('Notes are required');
    }

    if (!groq) {
      throw new Error('Groq API key not configured');
    }

    const startTime = Date.now();
    const systemPrompt = `You are an expert task extraction assistant. Extract every action item from the notes. For each task return:
- task: specific, actionable description
- owner: name if mentioned, otherwise 'Me'
- deadline: convert relative dates to actual dates (today is ${new Date().toISOString().split('T')[0]})
- priority: urgent (<3 days), high (<1 week), medium (<2 weeks), low (else)
- confidence: 0-1 score for extraction accuracy
- isSubtask: true if this is a subtask of a larger task
- parentTask: title of parent task if isSubtask is true
- dependencies: array of task titles this depends on (look for: "after", "then", "once X is done", "depends on")

Return ONLY valid JSON array, no markdown.`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: notes.trim() },
        ],
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = completion.choices[0]?.message?.content || '[]';
      const rawTasks = extractJsonArray(content);
      if (rawTasks.length === 0) {
        // Some models wrap the array in an object: {"tasks": [...]}
        const obj = content.match(/\{[\s\S]*\}/);
        if (obj) {
          try {
            const parsed = JSON.parse(obj[0]);
            if (Array.isArray(parsed.tasks)) {
              rawTasks.push(...parsed.tasks);
            }
          } catch { /* ignore */ }
        }
      }
      const tokens = (completion as any).usage?.total_tokens ?? 0;

      const tasks = this.normalizeExtractedTasks(rawTasks);
      const duplicates = this.detectDuplicates(tasks);
      const qualityScore = this.calculateQualityScore(tasks, notes);
      const processingTime = Date.now() - startTime;

      const metadata: ExtractionMetadata = {
        model: GROQ_MODEL,
        tokens,
        processingTime,
        fallbackUsed: false,
      };

      return { tasks, duplicates, qualityScore, extractionMetadata: metadata };
    } catch (error) {
      logger.error('Task parsing error:', { error });

      const fallbackTasks = this.fallbackExtraction(notes);
      const processingTime = Date.now() - startTime;

      if (fallbackTasks.length > 0) {
        const metadata: ExtractionMetadata = {
          model: 'fallback',
          tokens: 0,
          processingTime,
          fallbackUsed: true,
        };
        return {
          tasks: fallbackTasks,
          duplicates: [],
          qualityScore: 0.5,
          extractionMetadata: metadata,
        };
      }

      throw error;
    }
  }

  private static normalizeExtractedTasks(raw: any[]): ExtractedTask[] {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any) => {
        if (!item || typeof item !== 'object') return null;
        const task = (item.task ?? item.title ?? item.description ?? '').toString().trim();
        if (!task) return null;

        return {
          task,
          owner: (item.owner ?? item.assignee ?? 'Me').toString().trim(),
          deadline: (item.deadline ?? item.dueDate ?? item.due ?? 'Not specified').toString().trim(),
          priority: (item.priority ?? 'medium').toString().toLowerCase(),
          confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : 0.8,
          isSubtask: item.isSubtask === true,
          parentTask: item.parentTask ? item.parentTask.toString().trim() : undefined,
          dependencies: Array.isArray(item.dependencies) ? item.dependencies.map((d: any) => d.toString().trim()) : [],
        } as ExtractedTask;
      })
      .filter((t): t is ExtractedTask => t !== null);
  }

  /** Flag tasks with >80% title similarity as duplicates. */
  private static detectDuplicates(tasks: ExtractedTask[]): TaskDuplicate[] {
    const duplicates: TaskDuplicate[] = [];

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const similarity = this.calculateSimilarity(tasks[i]!.task, tasks[j]!.task);
        if (similarity > 0.8) {
          duplicates.push({
            task1: tasks[i]!.task,
            task2: tasks[j]!.task,
            similarity,
          });
        }
      }
    }

    return duplicates;
  }

  /** Levenshtein-based similarity score in [0, 1]. */
  private static calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1
          );
        }
      }
    }

    const maxLen = Math.max(s1.length, s2.length);
    return 1 - matrix[s2.length]![s1.length]! / maxLen;
  }

  /** Composite quality score: confidence, deadline coverage, priority coverage, extraction rate. */
  private static calculateQualityScore(tasks: ExtractedTask[], originalNotes: string): number {
    if (tasks.length === 0) return 0;

    const avgConfidence = tasks.reduce((sum, t) => sum + t.confidence, 0) / tasks.length;
    const hasDeadlines = tasks.filter(t => t.deadline !== 'Not specified').length / tasks.length;
    const hasPriorities = tasks.filter(t => t.priority && t.priority !== 'medium').length / tasks.length;
    const notesLines = originalNotes.split('\n').filter(l => l.trim()).length;
    const extractionRate = Math.min(1, tasks.length / Math.max(1, notesLines * 0.5));

    return (avgConfidence * 0.4 + hasDeadlines * 0.2 + hasPriorities * 0.2 + extractionRate * 0.2);
  }

  /** Regex-based fallback: extracts bullet/numbered lines when the LLM call fails. */
  private static fallbackExtraction(notes: string): ExtractedTask[] {
    return notes
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./))
      .map(line => ({
        task: line.replace(/^[-•\d.\s]+/, '').trim(),
        owner: 'Me',
        deadline: 'Not specified',
        priority: 'medium',
        confidence: 0.5,
        dependencies: [],
      }))
      .filter(item => item.task.length > 0);
  }

  /** Extract action items from an email thread. */
  static async parseTasksFromEmail(emailContent: string): Promise<{ task: string; owner: string; deadline: string; priority?: string }[]> {
    const emailPromptAddition = ' This is an email thread. Extract every action item, commitment, request, and deadline mentioned. Pay special attention to: "please", "can you", "by [date]", "I need", "let me know", "follow up".';
    const systemPrompt = `You are an expert assistant for task management. Extract every action item from the following email. For each task identify: the task description (make it specific and actionable), who owns it (name if mentioned, otherwise 'Me'), the deadline (extract from context like 'by Friday', 'end of month', 'ASAP'   convert to actual dates based on today's date), and priority (urgent if deadline <3 days, high if deadline <1 week, medium if <2 weeks, low otherwise). Return ONLY a valid JSON array, no markdown, no explanation.${emailPromptAddition}`;

    if (!emailContent?.trim()) throw new Error('Email content is required');
    if (!groq) throw new Error('Groq API key not configured');

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: emailContent.trim() },
        ],
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = completion.choices[0]?.message?.content || '[]';
      const tasks = extractJsonArray(content);
      return this.normalizeTaskArray(tasks);
    } catch (error) {
      logger.error('Email task parsing error:', { error });
      throw error;
    }
  }

  /** Extract actionable tasks from scraped web page content. */
  static async parseTasksFromWebPage(webContent: string): Promise<{ task: string; owner: string; deadline: string; priority?: string }[]> {
    const urlPromptAddition = ' This is content from a web page (brief, project doc, or job posting). Extract every actionable task, requirement, or deliverable mentioned.';
    const systemPrompt = `You are an expert assistant for task management. Extract every action item from the following content. For each task identify: the task description (make it specific and actionable), who owns it (name if mentioned, otherwise 'Me'), the deadline (extract from context like 'by Friday', 'end of month', 'ASAP'   convert to actual dates based on today's date), and priority (urgent if deadline <3 days, high if deadline <1 week, medium if <2 weeks, low otherwise). Return ONLY a valid JSON array, no markdown, no explanation.${urlPromptAddition}`;

    if (!webContent?.trim()) throw new Error('Web content is required');
    if (!groq) throw new Error('Groq API key not configured');

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: webContent.trim() },
        ],
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = completion.choices[0]?.message?.content || '[]';
      const tasks = extractJsonArray(content);
      return this.normalizeTaskArray(tasks);
    } catch (error) {
      logger.error('Web page task parsing error:', { error });
      throw error;
    }
  }

  /** Returns availability status for each configured AI provider. */
  static isAvailable(): { groq: boolean } {
    return {
      groq: !!groq,
    };
  }
}
