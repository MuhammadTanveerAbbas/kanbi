'use server';

export type GenerateTasksFromTextInput = {
  text: string;
};

export type GenerateTasksFromTextOutput = Array<{
  task: string;
  owner: string;
  deadline: string;
}>;

export async function generateTasksFromText(
  input: GenerateTasksFromTextInput
): Promise<GenerateTasksFromTextOutput> {
  return [];
}
