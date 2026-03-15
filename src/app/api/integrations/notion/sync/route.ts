import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotionSyncService } from '@/lib/integrations/notion-sync';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, boardId, tasks, databaseId } = body;

    if (action === 'push') {
      if (!boardId || !tasks) {
        return NextResponse.json({ error: 'boardId and tasks required' }, { status: 400 });
      }

      const result = await NotionSyncService.syncToNotion(user.id, boardId, tasks);
      return NextResponse.json(result);
    }

    if (action === 'pull') {
      if (!databaseId) {
        return NextResponse.json({ error: 'databaseId required' }, { status: 400 });
      }

      const result = await NotionSyncService.syncFromNotion(user.id, databaseId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action. Use push or pull' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
