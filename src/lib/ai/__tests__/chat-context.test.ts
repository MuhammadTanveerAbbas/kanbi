// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The assistant must describe every source it was given, and must answer the
 * arithmetic questions itself instead of paying for a model call. These tests
 * pin both behaviours, plus the vision gate that stops an image request with no
 * image from reaching the provider.
 */

const h = vi.hoisted(() => ({
  complete: vi.fn(async () => ({ model: 'test-model', content: 'model answer' })),
  configured: vi.fn(() => true),
}));

vi.mock('@/lib/ai/service', () => ({
  complete: h.complete,
  isInferenceConfigured: h.configured,
}));

import { ChatAssistant, buildSystemPrompt, type ChatContext } from '../chat-assistant';
import { FALLBACK_RESPONSES } from '../chat-copy';
import { MODEL_PROFILES, RETIRED_MODEL_PATTERNS, isVisionModel } from '../model-profiles';

const context: ChatContext = {
  tasks: [
    { id: 't1', title: 'Ship the pricing page', priority: 'urgent', status: 'todo' },
    { id: 't2', title: 'Write the launch email', priority: 'high', status: 'done' },
  ],
  todos: [
    { title: 'Call the accountant', done: false },
    { title: 'Renew the domain', done: true },
  ],
  notes: [
    { title: 'Q4 planning', content: 'Focus on retention and onboarding.' },
    { title: 'Interview notes', content: 'Candidate prefers remote work.' },
  ],
  images: [
    { name: 'whiteboard.png', caption: 'Roadmap sketch' },
    { name: 'receipt.jpg' },
  ],
  workloadHealth: 72,
  estimatedHours: 3,
  completedToday: 1,
};

beforeEach(() => {
  h.complete.mockClear();
  h.configured.mockReturnValue(true);
});

describe('buildSystemPrompt', () => {
  it('names todos, notes and images from the context', () => {
    const prompt = buildSystemPrompt(context);

    expect(prompt).toContain('Call the accountant');
    expect(prompt).toContain('Q4 planning');
    expect(prompt).toContain('Interview notes');
    expect(prompt).toContain('whiteboard.png');
    expect(prompt).toContain('receipt.jpg');
  });

  it('states the writing rules verbatim', () => {
    const prompt = buildSystemPrompt(context).toLowerCase();

    expect(prompt).toContain('no em dashes');
    expect(prompt).toContain('no en dashes');
    expect(prompt).toContain('no semicolons');
    expect(prompt).toContain('under 70 words');
  });
});

describe('direct answers', () => {
  it('answers a todo count question from the context without a model call', async () => {
    const reply = await ChatAssistant.generateResponse('How many todos do I have?', context);

    expect(reply).toContain('1');
    expect(reply).toContain('2');
    expect(h.complete).not.toHaveBeenCalled();
  });

  it('answers a note question with the note titles', async () => {
    const reply = await ChatAssistant.generateResponse('What notes do I have?', context);

    expect(reply).toContain('Q4 planning');
    expect(reply).toContain('Interview notes');
    expect(h.complete).not.toHaveBeenCalled();
  });
});

describe('image requests without images', () => {
  it('returns the fallback and does not call the provider', async () => {
    const reply = await ChatAssistant.generateResponse('Read the image on my note', {
      ...context,
      images: [],
    });

    expect(reply).toBe(FALLBACK_RESPONSES.noImages);
    expect(h.complete).not.toHaveBeenCalled();
  });
});

describe('model profiles', () => {
  function priorityOf(id: string): number {
    const lower = id.toLowerCase();
    const profile = MODEL_PROFILES.find((entry) =>
      entry.match.some((needle) => lower.includes(needle.toLowerCase())),
    );
    return profile ? profile.priority : Number.POSITIVE_INFINITY;
  }

  it('ranks the current free models ahead of the fallback band', () => {
    expect(priorityOf('gpt-oss-120b')).toBeLessThan(40);
    expect(priorityOf('qwen3.8-27b')).toBeLessThan(40);
    expect(priorityOf('llama-4-scout')).toBeLessThan(40);
  });

  it('still excludes the retired Llama 3.1 versatile id', () => {
    const retired = RETIRED_MODEL_PATTERNS.some((pattern) =>
      pattern.test('llama-3.1-70b-versatile'),
    );
    expect(retired).toBe(true);
  });

  it('recognises the vision models only', () => {
    expect(isVisionModel('qwen/qwen3.8-27b')).toBe(true);
    expect(isVisionModel('meta-llama/llama-4-scout-17b-16e-instruct')).toBe(true);
    expect(isVisionModel('openai/gpt-oss-120b')).toBe(false);
  });
});
