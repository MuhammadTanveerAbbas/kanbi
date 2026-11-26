// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * The fake database below records how the route scopes its queries. It exists
 * so a broken route that trusts a `user_id` from the request body cannot pass.
 */
const h = vi.hoisted(() => {
  const AUTH_ID = '11111111-1111-4111-8111-111111111111';
  const OTHER_ID = '22222222-2222-4222-8222-222222222222';

  const rows = [
    { id: 't1', user_id: AUTH_ID, list_id: 'l1', title: 'Mine', done: false },
    { id: 't2', user_id: OTHER_ID, list_id: 'l1', title: 'Theirs', done: false },
  ];

  const inserted: Record<string, unknown>[] = [];
  const eqCalls: Array<[string, unknown]> = [];

  function makeBuilder() {
    let pending: Record<string, unknown> | null = null;
    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: (column: string, value: unknown) => {
        eqCalls.push([column, value]);
        return builder;
      },
      order: () => builder,
      insert: (row: Record<string, unknown>) => {
        inserted.push(row);
        pending = row;
        return builder;
      },
      update: () => builder,
      delete: () => builder,
      single: async () => ({
        data: pending ? { id: 'new-todo', ...pending } : null,
        error: null,
      }),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
        const scope = eqCalls.find(([column]) => column === 'user_id');
        const data = rows.filter((row) => !scope || row.user_id === scope[1]);
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      },
    };
    return builder;
  }

  return { AUTH_ID, OTHER_ID, rows, inserted, eqCalls, makeBuilder };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: h.AUTH_ID } } })),
    },
    from: vi.fn(() => h.makeBuilder()),
  })),
}));

import { GET, POST } from '../todos/route';

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/todos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/todos', () => {
  beforeEach(() => {
    h.inserted.length = 0;
    h.eqCalls.length = 0;
  });

  it('derives user_id from the session and ignores the request body', async () => {
    const res = await POST(jsonRequest({
      user_id: 'someone-else',
      title: 'x',
      list_id: 'l1',
    }));

    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
    expect(h.inserted).toHaveLength(1);
    expect(h.inserted[0]?.user_id).toBe(h.AUTH_ID);
    expect(h.inserted[0]?.user_id).not.toBe('someone-else');
  });

  it('returns only rows scoped to the authenticated user on GET', async () => {
    const res = await GET(new NextRequest('http://localhost/api/todos'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].user_id).toBe(h.AUTH_ID);
    expect(h.eqCalls).toContainEqual(['user_id', h.AUTH_ID]);
  });

  it('rejects an empty title with a controlled validation error', async () => {
    const res = await POST(jsonRequest({ title: '', list_id: 'l1' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
