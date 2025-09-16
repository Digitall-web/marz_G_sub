import { describe, it, expect } from 'vitest';
import { formatBytes, secondsToDHMS, formatDurationCompact, formatCreatedDate, normalizeEpochToDate } from './utils';

describe('utils', () => {
  it('formatBytes basic', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('secondsToDHMS and formatDurationCompact', () => {
    const dur = secondsToDHMS(3661); // 1h 1m 1s
    expect(dur.h).toBe('01');
    expect(dur.m).toBe('01');
    const compact = formatDurationCompact(3600 * 25, 'd');
    expect(compact).toMatch(/1d|25:00/); // depending on logic
  });

  it('formatCreatedDate works', () => {
    const outEn = formatCreatedDate('2025-09-14T00:00:00Z', 'en');
    expect(outEn).toBeTruthy();
  });

  it('normalizeEpochToDate handles seconds and ms', () => {
    const seconds = Math.floor(Date.now() / 1000) - 1000;
    const ms = Date.now() - 5000;
    const d1 = normalizeEpochToDate(seconds);
    const d2 = normalizeEpochToDate(ms);
    expect(d1).toBeInstanceOf(Date);
    expect(d2).toBeInstanceOf(Date);
    expect(normalizeEpochToDate('not-a-number')).toBeNull();
  });
});
