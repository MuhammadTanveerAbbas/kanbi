import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Consolidated API keys - use GOOGLE_GENKIT_API_KEY for Gemini
const GEMINI_API_KEY = process.env.GOOGLE_GENKIT_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Initialize clients
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export type AIModel = 'groq' | 'gemini' | 'auto';

export interface GenerationOptions {
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  format?: 'text' | 'markdown' | 'json' | 'html';
  model?: AIModel;
}

/**
 * Unified AI service that intelligently chooses between Groq and Gemini
 * - Groq: Fast, cost-effective for simple tasks, quick responses
 * - Gemini: Better for complex reasoning, nuanced understanding
 */
export class AIService {
  /**
   * Generate content using the best model for the task
   */
  static async generate(
    input: string,
    options: GenerationOptions = {}
  ): Promise<string> {
    const { model = 'auto', tone = 'professional', length = 'medium', format = 'text' } = options;

    // Auto-select model based on task complexity
    const selectedModel = model === 'auto' ? this.selectBestModel(input, options) : model;

    try {
      if (selectedModel === 'groq' && groq) {
        return await this.generateWithGroq(input, tone, length, format);
      } else if (genAI) {
        return await this.generateWithGemini(input, tone, length, format);
      } else if (groq) {
        // Fallback to Groq if Gemini not available
        return await this.generateWithGroq(input, tone, length, format);
      } else {
        throw new Error('No AI service available. Please configure API keys.');
      }
    } catch (error) {
      console.error(`Error with ${selectedModel}:`, error);
      // Fallback to alternative model
      if (selectedModel === 'groq' && genAI) {
        console.log('Falling back to Gemini...');
        return await this.generateWithGemini(input, tone, length, format);
      } else if (selectedModel === 'gemini' && groq) {
        console.log('Falling back to Groq...');
        return await this.generateWithGroq(input, tone, length, format);
      }
      throw error;
    }
  }

  /**
   * Select the best model based on input complexity and requirements
   */
  private static selectBestModel(input: string, options: GenerationOptions): AIModel {
    // Use Groq for:
    // - Short inputs (< 500 chars)
    // - Simple formatting (text, markdown)
    // - Quick responses needed

    // Use Gemini for:
    // - Complex reasoning tasks
    // - JSON/structured output
    // - Long content generation
    // - Better understanding needed

    const inputLength = input.length;
    const isComplexFormat = options.format === 'json' || options.format === 'html';
    const isLongContent = options.length === 'long' || inputLength > 1000;

    if (isComplexFormat || isLongContent) {
      return genAI ? 'gemini' : (groq ? 'groq' : 'gemini');
    }

    // Default to Groq for speed, fallback to Gemini
    return groq ? 'groq' : (genAI ? 'gemini' : 'groq');
  }

  /**
   * Generate with Groq (fast, cost-effective)
   */
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

    const prompt = `You are a helpful AI assistant. Generate content based on the following input.

Input: ${input}

Requirements:
- Tone: ${tone}
- Length: ${lengthWords} words
- Format: ${formatInstruction}

Generate the content now:`;

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
      model: 'llama-3.3-70b-versatile', // Best Groq model for general tasks
      temperature: 0.7,
      max_tokens: length === 'short' ? 200 : length === 'medium' ? 500 : 1000,
    });

    return completion.choices[0]?.message?.content || '';
  }

  /**
   * Generate with Gemini (better reasoning, complex tasks)
   */
  private static async generateWithGemini(
    input: string,
    tone: string,
    length: string,
    format: string
  ): Promise<string> {
    if (!genAI) {
      throw new Error('Gemini API key not configured');
    }

    const lengthWords = length === 'short' ? '50-100' : length === 'medium' ? '100-300' : '300+';
    const formatInstruction = format === 'json'
      ? 'Return valid JSON only, no markdown code blocks.'
      : format === 'markdown'
        ? 'Use markdown formatting.'
        : format === 'html'
          ? 'Return HTML formatted content.'
          : 'Return plain text.';

    const prompt = `You are a helpful AI assistant. Generate content based on the following input.

Input: ${input}

Requirements:
- Tone: ${tone}
- Length: ${lengthWords} words
- Format: ${formatInstruction}

Generate the content now:`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp', // Fast and capable Gemini model
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Normalize AI response to { task, owner, deadline, priority }[]
   */
  private static normalizeTaskArray(raw: any[]): { task: string; owner: string; deadline: string; priority?: string }[] {
    return raw.map((item: any) => ({
      task: item.task ?? item.title ?? String(item.description ?? ''),
      owner: item.owner ?? item.assignee ?? 'Me',
      deadline: item.deadline ?? item.dueDate ?? item.due ?? 'Not specified',
      priority: item.priority ?? 'medium',
    })).filter((t: any) => t.task && t.task.trim().length > 0);
  }

  /**
   * Parse tasks from notes. Uses Groq for short input (<300 chars), Gemini for longer.
   * Falls back to the other model if primary fails.
   */
  static async parseTasks(notes: string): Promise<{ task: string; owner: string; deadline: string; priority?: string }[]> {
    if (!notes || typeof notes !== 'string') {
      throw new Error('Notes are required');
    }

    const systemPrompt = `You are an expert assistant for freelance consultants. Extract every action item from the following client meeting notes or email thread. For each task identify: the task description (make it specific and actionable), who owns it (consultant or client name if mentioned, otherwise 'Me'), the deadline (extract from context like 'by Friday', 'end of month', 'ASAP' — convert to actual dates based on today's date), and priority (urgent if deadline <3 days, high if deadline <1 week, medium if <2 weeks, low otherwise). Return ONLY a valid JSON array, no markdown, no explanation.`;

    const userContent = notes.trim();
    const useGroqFirst = userContent.length < 300;

    const tryGroq = async (): Promise<{ tasks: any[]; tokens: number }> => {
      if (!groq) throw new Error('Groq not configured');
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2048,
      });
      const content = completion.choices[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const raw = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(raw);
      const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      const tokens = (completion as any).usage?.total_tokens ?? 0;
      return { tasks, tokens };
    };

    const tryGemini = async (): Promise<{ tasks: any[]; tokens: number }> => {
      if (!genAI) throw new Error('Gemini not configured');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const prompt = systemPrompt + '\n\nNotes:\n' + userContent;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const raw = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(raw);
      const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      const tokens = (response as any).usageMetadata?.totalTokenCount ?? 0;
      return { tasks, tokens };
    };

    try {
      if (useGroqFirst && groq) {
        try {
          const { tasks, tokens } = await tryGroq();
          console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
          return this.normalizeTaskArray(tasks);
        } catch (err) {
          console.warn('[AI] Groq failed, falling back to Gemini', err);
          if (genAI) {
            const { tasks, tokens } = await tryGemini();
            console.log(`[AI] Used: gemini-2.0-flash-exp (Gemini), tokens: ${tokens}`);
            return this.normalizeTaskArray(tasks);
          }
          throw err;
        }
      }
      if (genAI) {
        try {
          const { tasks, tokens } = await tryGemini();
          console.log(`[AI] Used: gemini-2.0-flash-exp (Gemini), tokens: ${tokens}`);
          return this.normalizeTaskArray(tasks);
        } catch (err) {
          console.warn('[AI] Gemini failed, falling back to Groq', err);
          if (groq) {
            const { tasks, tokens } = await tryGroq();
            console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
            return this.normalizeTaskArray(tasks);
          }
          throw err;
        }
      }
      if (groq) {
        const { tasks, tokens } = await tryGroq();
        console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
        return this.normalizeTaskArray(tasks);
      }
      throw new Error('No AI service available');
    } catch (error) {
      console.error('Task parsing error:', error);
      return notes
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .map(line => ({
          task: line.replace(/^[-•\d.\s]+/, '').trim(),
          owner: 'Me',
          deadline: 'Not specified',
          priority: 'medium',
        }))
        .filter(item => item.task.length > 0);
    }
  }

  /**
   * Parse tasks from email thread (Gmail-specific prompt addition).
   */
  static async parseTasksFromEmail(emailContent: string): Promise<{ task: string; owner: string; deadline: string; priority?: string }[]> {
    const emailPromptAddition = ' This is an email thread. Extract every action item, commitment, request, and deadline mentioned. Pay special attention to: \'please\', \'can you\', \'by [date]\', \'I need\', \'let me know\', \'follow up\'.';
    const systemPrompt = `You are an expert assistant for freelance consultants. Extract every action item from the following client meeting notes or email thread. For each task identify: the task description (make it specific and actionable), who owns it (consultant or client name if mentioned, otherwise 'Me'), the deadline (extract from context like 'by Friday', 'end of month', 'ASAP' — convert to actual dates based on today's date), and priority (urgent if deadline <3 days, high if deadline <1 week, medium if <2 weeks, low otherwise). Return ONLY a valid JSON array, no markdown, no explanation.${emailPromptAddition}`;

    if (!emailContent?.trim()) throw new Error('Email content is required');
    const userContent = emailContent.trim();
    const useGroqFirst = userContent.length < 300;

    const tryGroq = async (): Promise<{ tasks: any[]; tokens: number }> => {
      if (!groq) throw new Error('Groq not configured');
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2048,
      });
      const content = completion.choices[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      return { tasks, tokens: (completion as any).usage?.total_tokens ?? 0 };
    };

    const tryGemini = async (): Promise<{ tasks: any[]; tokens: number }> => {
      if (!genAI) throw new Error('Gemini not configured');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(systemPrompt + '\n\nEmail:\n' + userContent);
      const response = result.response;
      const text = response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      return { tasks, tokens: (response as any).usageMetadata?.totalTokenCount ?? 0 };
    };

    try {
      if (useGroqFirst && groq) {
        try {
          const { tasks, tokens } = await tryGroq();
          console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
          return this.normalizeTaskArray(tasks);
        } catch (err) {
          if (genAI) {
            const { tasks, tokens } = await tryGemini();
            console.log(`[AI] Used: gemini-2.0-flash-exp (Gemini), tokens: ${tokens}`);
            return this.normalizeTaskArray(tasks);
          }
          throw err;
        }
      }
      if (genAI) {
        try {
          const { tasks, tokens } = await tryGemini();
          console.log(`[AI] Used: gemini-2.0-flash-exp (Gemini), tokens: ${tokens}`);
          return this.normalizeTaskArray(tasks);
        } catch (err) {
          if (groq) {
            const { tasks, tokens } = await tryGroq();
            console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
            return this.normalizeTaskArray(tasks);
          }
          throw err;
        }
      }
      if (groq) {
        const { tasks, tokens } = await tryGroq();
        console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
        return this.normalizeTaskArray(tasks);
      }
      throw new Error('No AI service available');
    } catch (error) {
      console.error('Email task parsing error:', error);
      throw error;
    }
  }

  /**
   * Parse tasks from web page content (URL-specific prompt).
   */
  static async parseTasksFromWebPage(webContent: string): Promise<{ task: string; owner: string; deadline: string; priority?: string }[]> {
    const urlPromptAddition = ' This is content from a web page (brief, project doc, or job posting). Extract every actionable task, requirement, or deliverable mentioned.';
    const systemPrompt = `You are an expert assistant for freelance consultants. Extract every action item from the following client meeting notes or email thread. For each task identify: the task description (make it specific and actionable), who owns it (consultant or client name if mentioned, otherwise 'Me'), the deadline (extract from context like 'by Friday', 'end of month', 'ASAP' — convert to actual dates based on today's date), and priority (urgent if deadline <3 days, high if deadline <1 week, medium if <2 weeks, low otherwise). Return ONLY a valid JSON array, no markdown, no explanation.${urlPromptAddition}`;

    if (!webContent?.trim()) throw new Error('Web content is required');
    const userContent = webContent.trim();
    const useGroqFirst = userContent.length < 300;

    const tryGroq = async (): Promise<{ tasks: any[]; tokens: number }> => {
      if (!groq) throw new Error('Groq not configured');
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2048,
      });
      const content = completion.choices[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      return { tasks, tokens: (completion as any).usage?.total_tokens ?? 0 };
    };

    const tryGemini = async (): Promise<{ tasks: any[]; tokens: number }> => {
      if (!genAI) throw new Error('Gemini not configured');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(systemPrompt + '\n\nContent:\n' + userContent);
      const response = result.response;
      const text = response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      return { tasks, tokens: (response as any).usageMetadata?.totalTokenCount ?? 0 };
    };

    try {
      if (useGroqFirst && groq) {
        try {
          const { tasks, tokens } = await tryGroq();
          console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
          return this.normalizeTaskArray(tasks);
        } catch (err) {
          if (genAI) {
            const { tasks, tokens } = await tryGemini();
            console.log(`[AI] Used: gemini-2.0-flash-exp (Gemini), tokens: ${tokens}`);
            return this.normalizeTaskArray(tasks);
          }
          throw err;
        }
      }
      if (genAI) {
        try {
          const { tasks, tokens } = await tryGemini();
          console.log(`[AI] Used: gemini-2.0-flash-exp (Gemini), tokens: ${tokens}`);
          return this.normalizeTaskArray(tasks);
        } catch (err) {
          if (groq) {
            const { tasks, tokens } = await tryGroq();
            console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
            return this.normalizeTaskArray(tasks);
          }
          throw err;
        }
      }
      if (groq) {
        const { tasks, tokens } = await tryGroq();
        console.log(`[AI] Used: llama-3.3-70b-versatile (Groq), tokens: ${tokens}`);
        return this.normalizeTaskArray(tasks);
      }
      throw new Error('No AI service available');
    } catch (error) {
      console.error('Web page task parsing error:', error);
      throw error;
    }
  }

  /**
   * Check if AI services are available
   */
  static isAvailable(): { groq: boolean; gemini: boolean } {
    return {
      groq: !!groq,
      gemini: !!genAI,
    };
  }
}
