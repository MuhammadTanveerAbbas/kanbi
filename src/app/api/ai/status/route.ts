import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const limitResult = await rateLimit(request, { maxRequests: 100, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);

  try {
    const availability = AIService.isAvailable();

    const response = NextResponse.json({
      available: availability.groq,
      services: {
        groq: availability.groq,
      },
      message: availability.groq
        ? 'Groq is available'
        : 'No AI services configured. Please add API keys.',
    });
    return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check AI status' },
      { status: 500 }
    );
  }
}
