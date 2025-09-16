import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyTextAdvanced, generateSafeConfFilename } from '../utils';

describe('generateSafeConfFilename', () => {
  it('masks long names', () => {
    const fn = generateSafeConfFilename('SuperLongSubscriptionName123456');
    expect(fn.startsWith('digitall-')).toBe(true);
    expect(fn.endsWith('.conf')).toBe(true);
    // mask pattern
    expect(fn).toMatch(/digitall-[A-Za-z0-9]{4}-x-[A-Za-z0-9]{2}\.conf/);
  });
  it('handles short names without masking', () => {
    const fn = generateSafeConfFilename('short');
    expect(fn).toBe('digitall-short.conf');
  });
  it('sanitizes special chars', () => {
    const fn = generateSafeConfFilename('نام/بد*:@#!');
    expect(fn).toMatch(/digitall-[A-Za-z0-9-]+\.conf/);
  });
});

describe('copyTextAdvanced', () => {
  beforeEach(() => {
    (global as any).navigator = { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } };
  });
  it('uses navigator.clipboard when available', async () => {
    const ok = await copyTextAdvanced('hello');
    expect(ok).toBe(true);
  });
  it('falls back to execCommand if clipboard API fails', async () => {
    (navigator as any).clipboard.writeText.mockRejectedValue(new Error('denied'));
    if (!(document as any).execCommand) {
      (document as any).execCommand = () => true; // simple polyfill
    }
    const execSpy = vi.spyOn(document, 'execCommand');
    // Need body for textarea injection
    if (!document.body) document.body = document.createElement('body');
    const ok = await copyTextAdvanced('fallback');
    expect(execSpy).toHaveBeenCalledWith('copy');
    expect(ok).toBe(true);
    execSpy.mockRestore();
  });
});
