import { NextRequest, NextResponse } from 'next/server';
import { parseTasksFromNotes } from '@/ai/flows/parse-tasks-from-notes';

export async function POST(request: NextRequest) {
  try {
    const { notes } = await request.json();
    
    if (!notes || typeof notes !== 'string') {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    const tasks = await parseTasksFromNotes({ notes });
    return NextResponse.json(tasks);
    
  } catch (error) {
    console.error('AI parsing error:', error);
    return NextResponse.json({ error: 'AI parsing failed' }, { status: 500 });
  }
}