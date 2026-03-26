import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';
import { AIService } from '@/lib/ai-service';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';

const NOTION_API_VERSION = process.env.NOTION_API_VERSION || '2022-06-28';

function extractPageId(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+/, '').split('/');
    const last = path[path.length - 1] || '';
    const match = last.match(/([a-f0-9]{32})$/i) || last.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (match) return match[1].replace(/-/g, '');
    if (/^[a-f0-9]{32}$/i.test(last)) return last;
    return null;
  } catch {
    return null;
  }
}

function blockToText(block: { type: string; [k: string]: unknown }): string {
  const type = block.type;
  const content = block[type];
  if (!content || typeof content !== 'object') return '';
  const richText = (content as { rich_text?: Array<{ plain_text?: string }> }).rich_text;
  if (!Array.isArray(richText)) return '';
  return richText.map((t) => t.plain_text || '').join('');
}

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

    const body = await request.json();
    const { pageUrl } = body;

    if (!pageUrl || typeof pageUrl !== 'string') {
      return NextResponse.json(
        { error: 'pageUrl is required' },
        { status: 400 }
      );
    }

    // Fetch stored Notion access token for this user
    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'notion')
      .single();

    if (!integration?.access_token) {
      return NextResponse.json(
        { error: 'Notion not connected. Please connect your Notion workspace first.' },
        { status: 401 }
      );
    }

    const accessToken = integration.access_token;

    const pageId = extractPageId(pageUrl.trim());
    if (!pageId) {
      return NextResponse.json(
        { error: 'Invalid Notion page URL. Use a link like https://notion.so/Your-Page-...' },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION,
    };

    let pageTitle = '';
    const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { 
      headers,
      signal: AbortSignal.timeout(30000)
    });
    if (pageRes.ok) {
      const pageData = (await pageRes.json()) as { properties?: Record<string, unknown> };
      const props = pageData.properties || {};
      const titleProp = Object.values(props).find((p: unknown) => (p as { type?: string })?.type === 'title') as { title?: Array<{ plain_text?: string }> } | undefined;
      if (titleProp?.title?.length) pageTitle = titleProp.title.map((t) => t.plain_text || '').join('');
    }

    const blocks: unknown[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL(`https://api.notion.com/v1/blocks/${pageId}/children`);
      url.searchParams.set('page_size', '100');
      if (cursor) url.searchParams.set('start_cursor', cursor);

      const res = await fetch(url.toString(), { 
        headers,
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { message?: string }).message || res.statusText;
        return NextResponse.json(
          { error: `Notion API: ${msg}` },
          { status: res.status === 401 ? 401 : 502 }
        );
      }

      const data = (await res.json()) as { results?: unknown[]; next_cursor?: string };
      const results = data.results || [];
      blocks.push(...results);
      cursor = data.next_cursor || undefined;
    } while (cursor);

    const supportedTypes = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'to_do'];
    const lines: string[] = [];
    for (const b of blocks as Array<{ type: string; [k: string]: unknown }>) {
      if (!supportedTypes.includes(b.type)) continue;
      const text = blockToText(b);
      if (text.trim()) lines.push(text.trim());
    }
    const plainText = lines.join('\n');

    if (!plainText.trim()) {
      return NextResponse.json(
        { error: 'No readable content found on this Notion page. Share the page with your integration.' },
        { status: 422 }
      );
    }

    const tasks = await AIService.parseTasks(plainText);

    await usageService.incrementAIUsage(user.id).catch((err) => {
      console.error('Failed to track AI usage:', err);
    });

    return NextResponse.json({
      tasks,
      pageTitle: pageTitle || undefined,
    });
  } catch (error: unknown) {
    console.error('Parse Notion error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Notion API timed out. Try again.' },
        { status: 408 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to import from Notion';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
