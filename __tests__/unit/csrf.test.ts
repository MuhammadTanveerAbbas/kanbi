import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { checkCsrfOrigin } from '@/lib/security';

function request(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {}
): NextRequest {
  return new NextRequest(new URL(path, 'https://kanbi.vercel.app'), {
    method: init.method ?? 'POST',
    headers: { host: 'kanbi.vercel.app', ...init.headers },
  });
}

describe('checkCsrfOrigin', () => {
  it('allows safe methods without inspecting the origin', () => {
    expect(checkCsrfOrigin(request('/api/boards', { method: 'GET' }))).toBe(true);
    expect(checkCsrfOrigin(request('/api/boards', { method: 'HEAD' }))).toBe(true);
    expect(checkCsrfOrigin(request('/api/boards', { method: 'OPTIONS' }))).toBe(true);
  });

  it('allows a same-origin request', () => {
    expect(
      checkCsrfOrigin(
        request('/api/boards', { headers: { origin: 'https://kanbi.vercel.app' } })
      )
    ).toBe(true);
  });

  it('allows a request carrying the same Host as its Origin', () => {
    expect(
      checkCsrfOrigin(request('/api/boards', { headers: { origin: 'http://kanbi.vercel.app' } }))
    ).toBe(true);
  });

  it('allows a configured production origin', () => {
    expect(
      checkCsrfOrigin(
        request('/api/boards', { headers: { origin: 'https://kanbi-actionboard.vercel.app' } })
      )
    ).toBe(true);
  });

  it('rejects a cross-site Origin', () => {
    expect(
      checkCsrfOrigin(
        request('/api/boards', { headers: { origin: 'https://evil.example.com' } })
      )
    ).toBe(false);
  });

  it('rejects a state-changing request with neither Origin nor Referer', () => {
    // A cross-site form POST that suppresses both headers must not be admitted.
    expect(checkCsrfOrigin(request('/api/boards'))).toBe(false);
  });

  it('rejects a malformed Origin header', () => {
    expect(
      checkCsrfOrigin(request('/api/boards', { headers: { origin: 'not-a-url' } }))
    ).toBe(false);
  });

  it('falls back to Referer when Origin is absent', () => {
    expect(
      checkCsrfOrigin(
        request('/api/boards', { headers: { referer: 'https://kanbi.vercel.app/dashboard' } })
      )
    ).toBe(true);
    expect(
      checkCsrfOrigin(
        request('/api/boards', { headers: { referer: 'https://evil.example.com/x' } })
      )
    ).toBe(false);
  });

  it('allows the Stripe webhook, which authenticates by signature', () => {
    expect(checkCsrfOrigin(request('/api/webhooks/stripe'))).toBe(true);
  });

  it('allows cron and keep-alive, which authenticate by bearer token', () => {
    expect(checkCsrfOrigin(request('/api/cron/cleanup'))).toBe(true);
    expect(checkCsrfOrigin(request('/api/keep-alive'))).toBe(true);
  });

  it('does not treat a lookalike path as server-to-server', () => {
    // /api/webhooks-evil must not inherit the webhook exemption.
    expect(checkCsrfOrigin(request('/api/webhooks-evil'))).toBe(false);
  });

  it('accepts an explicit same-site fetch signal', () => {
    expect(
      checkCsrfOrigin(
        request('/api/boards', {
          headers: { origin: 'https://proxy.internal', 'sec-fetch-site': 'same-origin' },
        })
      )
    ).toBe(true);
  });

  it('rejects a cross-site fetch signal', () => {
    expect(
      checkCsrfOrigin(
        request('/api/boards', {
          headers: { origin: 'https://evil.example.com', 'sec-fetch-site': 'cross-site' },
        })
      )
    ).toBe(false);
  });
});
