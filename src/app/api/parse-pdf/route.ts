import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';
import { AIService } from '@/lib/ai-service';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PDF_MIME = 'application/pdf';

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 10, windowMs: 60000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

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

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Use form field "file".' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 413 }
      );
    }

    if (file.type !== PDF_MIME) {
      return NextResponse.json(
        { error: 'Invalid file type. Only application/pdf is accepted.' },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const { text, numpages } = await pdfParse(buffer);

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'No text could be extracted from the PDF.' },
        { status: 422 }
      );
    }

    const tasks = await AIService.parseTasks(text.trim());

    await usageService.incrementAIUsage(user.id).catch((err) => {
      console.error('Failed to track AI usage:', err);
    });

    return NextResponse.json({
      tasks,
      meta: { pages: numpages, characterCount: text.length },
    });
  } catch (error: unknown) {
    console.error('Parse PDF error:', error);
    const message = error instanceof Error ? error.message : 'Failed to parse PDF';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
