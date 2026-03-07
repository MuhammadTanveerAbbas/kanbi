'use server';

export type ParseTasksFromNotesInput = {
  notes: string;
};

export type ParseTasksFromNotesOutput = Array<{
  task: string;
  owner: string;
  deadline: string;
}>;

export async function parseTasksFromNotes(
  input: ParseTasksFromNotesInput
): Promise<ParseTasksFromNotesOutput> {
  return [];
}
