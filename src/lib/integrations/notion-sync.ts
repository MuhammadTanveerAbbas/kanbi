import { NotionClient, NotionTask } from './notion-client';
import { createClient } from '@/lib/supabase/server';

interface KanbiTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  owner?: string;
  deadline?: string;
}

export class NotionSyncService {
  static async syncToNotion(userId: string, boardId: string, tasks: KanbiTask[]): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const notionClient = await NotionClient.getForUser(userId);
    if (!notionClient) {
      throw new Error('Notion not connected');
    }

    const supabase = await createClient();
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'notion')
      .single();

    if (!integration) {
      throw new Error('Notion integration not found');
    }

    const databaseId = (integration as any).metadata?.database_id;
    if (!databaseId) {
      throw new Error('Notion database not configured');
    }

    const errors: string[] = [];
    let synced = 0;

    for (const task of tasks) {
      try {
        const notionTask: NotionTask = {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          owner: task.owner,
          deadline: task.deadline,
        };

        await notionClient.createPage(databaseId, notionTask);
        synced++;
      } catch (error: any) {
        errors.push(`Failed to sync "${task.title}": ${error.message}`);
      }
    }

    await this.logSync(userId, 'push', synced, errors);

    return { success: errors.length === 0, synced, errors };
  }

  static async syncFromNotion(userId: string, databaseId: string): Promise<{ tasks: KanbiTask[]; errors: string[] }> {
    const notionClient = await NotionClient.getForUser(userId);
    if (!notionClient) {
      throw new Error('Notion not connected');
    }

    const errors: string[] = [];
    const tasks: KanbiTask[] = [];

    try {
      const pages = await notionClient.queryDatabase(databaseId);

      for (const page of pages) {
        try {
          const notionTask = notionClient.parseNotionPage(page);
          tasks.push({
            id: notionTask.id,
            title: notionTask.title,
            status: notionTask.status,
            priority: notionTask.priority,
            owner: notionTask.owner,
            deadline: notionTask.deadline,
          });
        } catch (error: any) {
          errors.push(`Failed to parse page: ${error.message}`);
        }
      }

      await this.logSync(userId, 'pull', tasks.length, errors);
    } catch (error: any) {
      errors.push(`Failed to query database: ${error.message}`);
    }

    return { tasks, errors };
  }

  static async updateNotionTask(userId: string, pageId: string, updates: Partial<KanbiTask>): Promise<void> {
    const notionClient = await NotionClient.getForUser(userId);
    if (!notionClient) {
      throw new Error('Notion not connected');
    }

    await notionClient.updatePage(pageId, updates);
  }

  static async deleteNotionTask(userId: string, pageId: string): Promise<void> {
    const notionClient = await NotionClient.getForUser(userId);
    if (!notionClient) {
      throw new Error('Notion not connected');
    }

    await notionClient.deletePage(pageId);
  }

  private static async logSync(userId: string, direction: 'push' | 'pull', count: number, errors: string[]): Promise<void> {
    const supabase = await createClient();
    await supabase.from('integrations').update({
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('provider', 'notion');
  }
}
