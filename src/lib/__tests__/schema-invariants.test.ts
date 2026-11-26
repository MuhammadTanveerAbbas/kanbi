// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const schemaPath = fileURLToPath(new URL('../../../supabase/schema.sql', import.meta.url))
const schema = readFileSync(schemaPath, 'utf8')

const newTables = ['todo_lists', 'todos', 'notes', 'note_images']

describe('schema.sql personal management invariants', () => {
  it('creates all four new tables with CREATE TABLE IF NOT EXISTS', () => {
    for (const table of newTables) {
      expect(schema).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
    }
  })

  it('enables row level security on all four new tables', () => {
    for (const table of newTables) {
      expect(schema).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
    }
  })

  it('defines at least four user scoped policies for each new table', () => {
    for (const table of newTables) {
      const policies = schema.split('\n').filter((line) =>
        line.includes('CREATE POLICY') &&
        line.includes(`ON ${table}`) &&
        line.includes('auth.uid() = user_id'),
      )
      expect(policies.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('requires child inserts to target a parent the caller owns', () => {
    const expected = [
      'CREATE POLICY "Users can insert own todos" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.todo_lists pl WHERE pl.id = todos.list_id AND pl.user_id = auth.uid()));',
      'CREATE POLICY "Users can insert own note images" ON note_images FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_images.note_id AND n.user_id = auth.uid()));',
    ]
    for (const line of expected) {
      expect(schema).toContain(line)
    }
  })

  it('caps image size at 5 MiB', () => {
    expect(schema).toContain(
      'size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880)',
    )
  })

  it('allows only jpeg, png, webp and gif images', () => {
    expect(schema).toContain(
      "mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/gif'))",
    )
  })
})
