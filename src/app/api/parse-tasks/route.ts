import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const limit = rateLimit(request, { maxRequests: 20, windowMs: 60000 });
  if (!limit.success) return rateLimitResponse();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can use AI
    const canUse = await usageService.canUseAI(user.id);
    if (!canUse) {
      return NextResponse.json(
        {
          error: 'AI usage limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    const { notes } = await request.json();

    if (!notes || typeof notes !== 'string') {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    if (notes.length > 10000) {
      return NextResponse.json(
        { error: 'Notes too long. Max 10,000 characters.' },
        { status: 413 }
      );
    }

    // Use unified AI service (prefers Gemini for better task understanding)
    const tasks = await AIService.parseTasks(notes);

    // Track AI usage after successful parsing
    await usageService.incrementAIUsage(user.id).catch((error) => {
      console.error('Failed to track AI usage:', error);
      // Don't fail the request if tracking fails
    });

    return NextResponse.json(tasks);

  } catch (error: any) {
    console.error('AI parsing error:', error);

    // Don't return 429 for rate limit errors from usage service
    if (error.message?.includes('limit exceeded')) {
      return NextResponse.json(
        { error: 'AI usage limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'AI parsing failed' },
      { status: 500 }
    );
  }
}
