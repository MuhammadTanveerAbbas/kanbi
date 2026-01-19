import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';

export async function POST(request: NextRequest) {
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

    const { input, tone, length, format, model } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    const result = await AIService.generate(input, {
      tone: tone || 'professional',
      length: length || 'medium',
      format: format || 'text',
      model: model || 'auto',
    });

    // Track AI usage after successful generation
    await usageService.incrementAIUsage(user.id).catch((error) => {
      console.error('Failed to track AI usage:', error);
      // Don't fail the request if tracking fails
    });

    return NextResponse.json({ output: result });
  } catch (error: any) {
    console.error('Generation error:', error);

    // Don't return 429 for rate limit errors from usage service
    if (error.message?.includes('limit exceeded')) {
      return NextResponse.json(
        { error: 'AI usage limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
