// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { IMAGE_MAX_BYTES, DOCX_MAX_BYTES } from '@/lib/constants';

/**
 * The fake below records what the routes write and what they upload. It exists
 * so a route that trusts a `user_id` from the request body, or that uploads an
 * oversized file, cannot pass.
 */
const h = vi.hoisted(() => {
  const AUTH_ID = '11111111-1111-4111-8111-111111111111';

  const inserted: Array<{ table: string; row: Record<string, unknown> }> = [];
  const uploads: Array<{ bucket: string; path: string }> = [];

  function builder(table: string) {
    let pending: Record<string, unknown> | null = null;
    const b: Record<string, unknown> = {
      select: () => b,
      eq: () => b,
      order: () => b,
      limit: () => b,
      insert: (row: Record<string, unknown>) => {
        pending = row;
        inserted.push({ table, row });
        return b;
      },
      update: (row: Record<string, unknown>) => {
        pending = row;
        return b;
      },
      delete: () => b,
      single: async () => ({ data: pending ? { id: 'row-1', ...pending } : null, error: null }),
      maybeSingle: async () => ({ data: pending ? { id: 'row-1', ...pending } : null, error: null }),
      then: (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve, reject),
    };
    return b;
  }

  const storage = {
    from: (bucket: string) => ({
      upload: async (path: string) => {
        uploads.push({ bucket, path });
        return { data: { path }, error: null };
      },
      remove: async () => ({ data: [], error: null }),
      createSignedUrl: async (path: string) => ({
        data: { signedUrl: `https://signed.example/${path}` },
        error: null,
      }),
    }),
  };

  return { AUTH_ID, inserted, uploads, builder, storage };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: h.AUTH_ID } } })) },
    from: vi.fn((table: string) => h.builder(table)),
    storage: h.storage,
  })),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async () => ({
      value: '<script>alert(1)</script>Quarterly plan <b>draft</b>',
    })),
  },
}));

import { validateImage } from '@/lib/server/image-validation';
import { POST as createNote } from '../notes/route';
import { POST as uploadNoteImage } from '../notes/images/route';
import { POST as importNote } from '../notes/import/route';

function formRequest(url: string, form: FormData): NextRequest {
  return new NextRequest(url, { method: 'POST', body: form });
}

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/notes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('validateImage', () => {
  it('rejects a file above the 5 MiB cap', () => {
    const file = new File([new Uint8Array(IMAGE_MAX_BYTES + 1)], 'big.png', { type: 'image/png' });
    expect(validateImage(file)).toEqual({ ok: false, code: 'IMAGE_TOO_LARGE' });
  });

  it('rejects a type that is not an allowed image', () => {
    const file = new File([new Uint8Array(8)], 'notes.txt', { type: 'text/plain' });
    expect(validateImage(file)).toEqual({ ok: false, code: 'INVALID_IMAGE_TYPE' });
  });

  it('accepts an allowed image under the cap', () => {
    const file = new File([new Uint8Array(8)], 'ok.png', { type: 'image/png' });
    expect(validateImage(file)).toEqual({ ok: true });
  });
});

describe('/api/notes', () => {
  beforeEach(() => {
    h.inserted.length = 0;
    h.uploads.length = 0;
  });

  it('ignores a forged user_id and uses the session user', async () => {
    const res = await createNote(jsonRequest({
      user_id: 'someone-else',
      title: 'Plan',
      content: 'Body',
    }));

    expect(res.status).toBe(201);
    expect(h.inserted).toHaveLength(1);
    expect(h.inserted[0]!.table).toBe('notes');
    expect(h.inserted[0]!.row.user_id).toBe(h.AUTH_ID);
  });

  it('rejects an empty title with a controlled validation error', async () => {
    const res = await createNote(jsonRequest({ title: '', content: 'Body' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('/api/notes/images', () => {
  beforeEach(() => {
    h.inserted.length = 0;
    h.uploads.length = 0;
  });

  it('returns 413 for an oversized file and never touches storage', async () => {
    const form = new FormData();
    form.append('noteId', 'note-1');
    form.append('file', new File([new Uint8Array(IMAGE_MAX_BYTES + 1)], 'big.png', { type: 'image/png' }));

    const res = await uploadNoteImage(formRequest('http://localhost/api/notes/images', form));

    expect(res.status).toBe(413);
    expect(h.uploads).toHaveLength(0);
    expect(h.inserted).toHaveLength(0);
  });

  it('returns 400 for a non image type and never touches storage', async () => {
    const form = new FormData();
    form.append('noteId', 'note-1');
    form.append('file', new File([new Uint8Array(8)], 'notes.txt', { type: 'text/plain' }));

    const res = await uploadNoteImage(formRequest('http://localhost/api/notes/images', form));

    expect(res.status).toBe(400);
    expect(h.uploads).toHaveLength(0);
  });

  it('stores an allowed image under the caller folder and records the row', async () => {
    const form = new FormData();
    form.append('noteId', 'note-1');
    form.append('file', new File([new Uint8Array(8)], 'ok.png', { type: 'image/png' }));

    const res = await uploadNoteImage(formRequest('http://localhost/api/notes/images', form));

    expect(res.status).toBe(201);
    expect(h.uploads).toHaveLength(1);
    expect(h.uploads[0]!.bucket).toBe('files');
    expect(h.uploads[0]!.path.startsWith(`${h.AUTH_ID}/notes/note-1/`)).toBe(true);
    expect(h.inserted).toHaveLength(1);
    expect(h.inserted[0]!.row.user_id).toBe(h.AUTH_ID);
    expect(h.inserted[0]!.row.size_bytes).toBe(8);
  });
});

describe('/api/notes/import', () => {
  beforeEach(() => {
    h.inserted.length = 0;
    h.uploads.length = 0;
  });

  it('strips angle brackets from extracted DOCX text', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(8)], 'plan.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }));

    const res = await importNote(formRequest('http://localhost/api/notes/import', form));

    expect(res.status).toBe(201);
    expect(h.inserted).toHaveLength(1);
    const content = String(h.inserted[0]!.row.content);
    expect(content).not.toContain('<');
    expect(content).not.toContain('>');
    expect(content).toContain('Quarterly plan');
  });

  it('returns 413 above the DOCX cap', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(DOCX_MAX_BYTES + 1)], 'plan.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }));

    const res = await importNote(formRequest('http://localhost/api/notes/import', form));

    expect(res.status).toBe(413);
    expect(h.inserted).toHaveLength(0);
  });

  it('returns 400 for a file that is not a DOCX', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(8)], 'plan.txt', { type: 'text/plain' }));

    const res = await importNote(formRequest('http://localhost/api/notes/import', form));

    expect(res.status).toBe(400);
    expect(h.inserted).toHaveLength(0);
  });
});
