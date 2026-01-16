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
   * Parse tasks from notes (uses Gemini for better understanding)
   */
  static async parseTasks(notes: string): Promise<any[]> {
    if (!notes || typeof notes !== 'string') {
      throw new Error('Notes are required');
    }

    const prompt = `You are an AI assistant tasked with extracting tasks from notes or meeting minutes.

Analyze the following notes:
${notes}

Identify potential tasks and extract them. Return a JSON array where each task has:
- task: The task description (actionable item)
- owner: Who is responsible (use "Unassigned" if not specified)
- deadline: When it's due (use "Not specified" if not mentioned)

Return ONLY a valid JSON array, no other text. Example format:
[
  {"task": "Review quarterly budget report", "owner": "John", "deadline": "Friday"},
  {"task": "Call dentist", "owner": "Unassigned", "deadline": "Not specified"}
]`;

    try {
      // Prefer Gemini for task parsing (better understanding)
      if (genAI) {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-exp',
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
      } else if (groq) {
        // Fallback to Groq
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a task extraction AI. Always return valid JSON arrays only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const content = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      } else {
        throw new Error('No AI service available');
      }
    } catch (error) {
      console.error('Task parsing error:', error);
      // Return fallback structure
      return notes
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .map(line => ({
          task: line.replace(/^[-•\d.\s]+/, '').trim(),
          owner: 'Unassigned',
          deadline: 'Not specified',
        }))
        .filter(item => item.task.length > 0);
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
