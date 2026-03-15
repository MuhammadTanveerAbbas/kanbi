import { createClient } from '@/lib/supabase/client';

export interface Board {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  icon: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBoardInput {
  title: string;
  content: string;
  category?: string;
  icon?: string;
}

export interface UpdateBoardInput {
  title?: string;
  content?: string;
  category?: string;
  icon?: string;
  is_favorite?: boolean;
}

export class BoardService {
  private static supabase = createClient();

  static async getAll(): Promise<Board[]> {
    const { data, error } = await this.supabase
      .from('saved_generations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Board | null> {
    const { data, error } = await this.supabase
      .from('saved_generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(input: CreateBoardInput): Promise<Board> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('saved_generations')
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content,
        category: input.category || 'other',
        icon: input.icon || 'file',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, input: UpdateBoardInput): Promise<Board> {
    const { data, error } = await this.supabase
      .from('saved_generations')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('saved_generations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async toggleFavorite(id: string, isFavorite: boolean): Promise<Board> {
    return this.update(id, { is_favorite: isFavorite });
  }

  static async getFavorites(): Promise<Board[]> {
    const { data, error } = await this.supabase
      .from('saved_generations')
      .select('*')
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getRecent(limit: number = 5): Promise<Board[]> {
    const { data, error } = await this.supabase
      .from('saved_generations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async search(query: string): Promise<Board[]> {
    const { data, error } = await this.supabase
      .from('saved_generations')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static subscribeToChanges(callback: (payload: any) => void) {
    return this.supabase
      .channel('board_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_generations' }, callback)
      .subscribe();
  }
}
