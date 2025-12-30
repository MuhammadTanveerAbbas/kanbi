'use server';

import { generateTasksFromText, GenerateTasksFromTextInput } from '@/ai/flows/generate-tasks-from-text';

export async function generateTasksAction(input: GenerateTasksFromTextInput) {
  return await generateTasksFromText(input);
}
