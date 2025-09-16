import { describe, it, expect, vi } from 'vitest';
import { fetchWithRetry } from '../utils';

describe('fetchWithRetry', () => {
  it('retries failed attempts then succeeds', async () => {
    const calls: number[] = [];
    const mockFetch = vi.fn(async () => {
      calls.push(Date.now());
      if (calls.length < 3) {
        return new Response('fail', { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    (globalThis as any).fetch = mockFetch;
    const res = await fetchWithRetry('https://example.test/data', { attempts: 4, timeout: 2000 });
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3); // two failures + success
  });

  it('stops early on non-retryable status (e.g., 404)', async () => {
    const mockFetch = vi.fn(async () => new Response('nf', { status: 404 }));
    ;(globalThis as any).fetch = mockFetch;
    const res = await fetchWithRetry('https://example.test/404', { attempts: 5 });
    expect(res.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting attempts', async () => {
    const mockFetch = vi.fn(async () => new Response('err', { status: 500 }));
    ;(globalThis as any).fetch = mockFetch;
    await expect(fetchWithRetry('https://example.test/fail', { attempts: 2, baseDelay: 10, timeout: 500 }))
      .rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
