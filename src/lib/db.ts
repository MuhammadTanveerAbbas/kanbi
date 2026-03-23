import { createClient } from '@/lib/supabase/client'

interface BoardRow {
  id: string
  name: string
  folder: string
  task_count: number
  updated_at: string
}

interface TaskRow {
  id: string
  board_id: string
  user_id: string
  title: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'todo' | 'wip' | 'done'
  label: string
  due_date: string | null
  estimate: string | null
  gcal_set: boolean
  gcal_event_id: string | null
}

interface AiUsageRow {
  user_id: string
  month: string
  extraction_count: number
  chat_count: number
}

interface SaveTaskInput {
  id: string
  title: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'todo' | 'wip' | 'done'
  label: string
  dueDate?: string
  estimate?: string
  gcalSet?: boolean
}

export const loadBoards = async (userId: string): Promise<BoardRow[]> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) {
      console.error('Load boards error:', error)
      throw new Error(error.message || 'Failed to load boards')
    }
    return (data as BoardRow[]) ?? []
  } catch (error) {
    console.error('Load boards error:', error)
    return [] // Return empty array on error instead of throwing
  }
}

export const loadTasksForBoard = async (boardId: string): Promise<TaskRow[]> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at')
    if (error) {
      console.error('Load tasks error:', error)
      throw new Error(error.message || 'Failed to load tasks')
    }
    return (data as TaskRow[]) ?? []
  } catch (error) {
    console.error('Load tasks error:', error)
    return [] // Return empty array on error instead of throwing
  }
}

export const saveBoard = async (
  name: string,
  folder: string,
  tasks: SaveTaskInput[],
  userId: string
): Promise<BoardRow> => {
  try {
    const supabase = createClient()
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({ name, folder, user_id: userId, task_count: tasks.length })
      .select()
      .single()
    if (boardError || !board) {
      console.error('Save board error:', boardError)
      throw new Error(boardError?.message || 'Failed to save board')
    }

    if (tasks.length > 0) {
      const taskRows = tasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        label: task.label,
        due_date: task.dueDate ?? null,
        estimate: task.estimate ?? null,
        gcal_set: task.gcalSet ?? false,
        board_id: board.id,
        user_id: userId,
      }))
      const { error: taskError } = await supabase.from('tasks').insert(taskRows)
      if (taskError) {
        console.error('Save tasks error:', taskError)
        throw new Error(taskError.message || 'Failed to save tasks')
      }
    }

    return board as BoardRow
  } catch (error) {
    console.error('Save board error:', error)
    throw error instanceof Error ? error : new Error('Failed to save board')
  }
}

export const updateTaskStatus = async (
  taskId: string,
  status: 'todo' | 'wip' | 'done'
): Promise<void> => {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (error) {
      console.error('Update task status error:', error)
      throw new Error(error.message || 'Failed to update task status')
    }
  } catch (error) {
    console.error('Update task status error:', error)
    throw error instanceof Error ? error : new Error('Failed to update task status')
  }
}

export const deleteBoard = async (boardId: string): Promise<void> => {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('boards').delete().eq('id', boardId)
    if (error) {
      console.error('Delete board error:', error)
      throw new Error(error.message || 'Failed to delete board')
    }
  } catch (error) {
    console.error('Delete board error:', error)
    throw error instanceof Error ? error : new Error('Failed to delete board')
  }
}

export const renameBoard = async (boardId: string, name: string): Promise<void> => {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('boards').update({ name }).eq('id', boardId)
    if (error) {
      console.error('Rename board error:', error)
      throw new Error(error.message || 'Failed to rename board')
    }
  } catch (error) {
    console.error('Rename board error:', error)
    throw error instanceof Error ? error : new Error('Failed to rename board')
  }
}

export const moveBoardFolder = async (boardId: string, folder: string): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase.from('boards').update({ folder }).eq('id', boardId)
  if (error) throw error
}

export const markGcalSet = async (taskIds: string[], gcalEventId: string): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ gcal_set: true, gcal_event_id: gcalEventId })
    .in('id', taskIds)
  if (error) throw error
}

export const getOrCreateUsage = async (userId: string): Promise<AiUsageRow | null> => {
  const supabase = createClient()
  const month = new Date().toISOString().slice(0, 7)
  const today = new Date().toISOString().split('T')[0]
  // Ensure a usage_tracking row exists for today
  const { error: upsertError } = await supabase
    .from('usage_tracking')
    .upsert({ user_id: userId, date: today }, { onConflict: 'user_id,date', ignoreDuplicates: true })
  if (upsertError) throw upsertError

  // Return a compatible shape using monthly totals
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('usage_tracking')
    .select('ai_used_count')
    .eq('user_id', userId)
    .gte('date', monthStart)
  if (error) throw error

  const totalAI = (data ?? []).reduce((sum, row) => sum + (row.ai_used_count || 0), 0)
  return { user_id: userId, month, extraction_count: totalAI, chat_count: 0 }
}

export const incrementUsage = async (
  userId: string,
  field: 'extraction_count' | 'chat_count'
): Promise<void> => {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.rpc('increment_ai_usage', {
    p_user_id: userId,
    p_date: today,
  })
  if (error) throw error
}
