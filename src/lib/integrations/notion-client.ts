import { Client } from '@notionhq/client';
import { createClient } from '@/lib/supabase/server';

export interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  owner?: string;
  deadline?: string;
}

export class NotionClient {
  private client: Client;

  constructor(accessToken: string) {
    this.client = new Client({ auth: accessToken });
  }

  static async getForUser(userId: string): Promise<NotionClient | null> {
    const supabase = await createClient();
    const { data } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'notion')
      .single();

    if (!data?.access_token) return null;
    return new NotionClient(data.access_token);
  }

  async getDatabases() {
    const response = await this.client.search({
      filter: { property: 'object', value: 'page' },
    });
    return response.results.filter((result: any) => result.object === 'database');
  }

  async getDatabase(databaseId: string) {
    return await this.client.databases.retrieve({ database_id: databaseId });
  }

  async queryDatabase(databaseId: string) {
    const response = await this.client.search({
      filter: { property: 'object', value: 'page' },
      query: databaseId,
    });
    return response.results;
  }

  async createPage(databaseId: string, task: NotionTask) {
    return await this.client.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: task.title } }] },
        Status: { select: { name: task.status } },
        Priority: { select: { name: task.priority } },
        Owner: { rich_text: [{ text: { content: task.owner || 'Me' } }] },
        Deadline: task.deadline && task.deadline !== 'Not specified'
          ? { date: { start: task.deadline } }
          : { date: null },
      },
    });
  }

  async updatePage(pageId: string, task: Partial<NotionTask>) {
    const properties: any = {};

    if (task.title) {
      properties.Name = { title: [{ text: { content: task.title } }] };
    }
    if (task.status) {
      properties.Status = { select: { name: task.status } };
    }
    if (task.priority) {
      properties.Priority = { select: { name: task.priority } };
    }
    if (task.owner) {
      properties.Owner = { rich_text: [{ text: { content: task.owner } }] };
    }
    if (task.deadline) {
      properties.Deadline = task.deadline !== 'Not specified'
        ? { date: { start: task.deadline } }
        : { date: null };
    }

    return await this.client.pages.update({
      page_id: pageId,
      properties,
    });
  }

  async deletePage(pageId: string) {
    return await this.client.pages.update({
      page_id: pageId,
      archived: true,
    });
  }

  parseNotionPage(page: any): NotionTask {
    const props = page.properties;
    return {
      id: page.id,
      title: props.Name?.title?.[0]?.text?.content || 'Untitled',
      status: props.Status?.select?.name || 'To Do',
      priority: props.Priority?.select?.name || 'Medium',
      owner: props.Owner?.rich_text?.[0]?.text?.content || 'Me',
      deadline: props.Deadline?.date?.start || 'Not specified',
    };
  }
}
