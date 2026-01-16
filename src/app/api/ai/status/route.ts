import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    const availability = AIService.isAvailable();

    return NextResponse.json({
      available: availability.groq || availability.gemini,
      services: {
        groq: availability.groq,
        gemini: availability.gemini,
      },
      message: availability.groq && availability.gemini
        ? 'Both AI services are available'
        : availability.groq
          ? 'Only Groq is available'
          : availability.gemini
            ? 'Only Gemini is available'
            : 'No AI services configured. Please add API keys.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check AI status' },
      { status: 500 }
    );
  }
}
