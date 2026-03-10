import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';
import { AIService } from '@/lib/ai-service';
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

    const canUse = await usageService.canUseAI(user.id);
    if (!canUse) {
      return NextResponse.json(
        { error: 'AI usage limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const emailContent = body?.emailContent;

    if (typeof emailContent !== 'string') {
      return NextResponse.json(
        { error: 'emailContent (string) is required' },
        { status: 400 }
      );
    }

    if (!emailContent.trim()) {
      return NextResponse.json(
        { error: 'Email content cannot be empty' },
        { status: 400 }
      );
    }

    if (emailContent.length > 50000) {
      return NextResponse.json(
        { error: 'Email content too long. Max 50,000 characters.' },
        { status: 413 }
      );
    }

    const tasks = await AIService.parseTasksFromEmail(emailContent.trim());

    await usageService.incrementAIUsage(user.id).catch((err) => {
      console.error('Failed to track AI usage:', err);
    });

    return NextResponse.json(tasks);
  } catch (error: unknown) {
    console.error('Parse Gmail error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract tasks from email';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
