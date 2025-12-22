import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const generateExamplePrompt = ai.definePrompt({
  name: 'generateExamplePrompt',
  input: { schema: z.object({}) },
  output: { schema: z.string() },
  prompt: `Generate exactly 4-5 practical tasks as bullet points with dashes. Include varied tasks with some deadlines/priorities. Return only the bullet points, nothing else.
  
  - Review quarterly budget report by Friday
  - Call dentist to schedule appointment  
  - Fix login bug in user dashboard (high priority)
  - Plan team meeting for next week
  - Update project documentation`,
});

const fallbackExample = `- Review quarterly budget report by Friday
- Call dentist to schedule appointment
- Fix login bug in user dashboard - high priority
- Plan team meeting for next week
- Update project documentation`;

export async function POST(request: NextRequest) {
  try {
    const { output } = await generateExamplePrompt({});
    return NextResponse.json({ example: output });
  } catch (error) {
    return NextResponse.json({ example: fallbackExample });
  }
}