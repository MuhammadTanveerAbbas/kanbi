import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { notes } = await request.json();

    if (!notes || typeof notes !== 'string') {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    // Use unified AI service (prefers Gemini for better task understanding)
    const tasks = await AIService.parseTasks(notes);
    return NextResponse.json(tasks);

  } catch (error: any) {
    console.error('AI parsing error:', error);
    return NextResponse.json(
      { error: error.message || 'AI parsing failed' },
      { status: 500 }
    );
  }
}
