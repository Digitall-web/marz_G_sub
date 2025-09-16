// Utility helpers extracted for reuse + unit testing
// Optional localized units; pass lang 'fa' to get Persian labels.
export const formatBytes = (bytes: number, lang: 'fa' | 'en' = 'en'): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return lang === 'fa' ? '۰ بایت' : '0 B';
  const k = 1024;
  const unitsEn = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const unitsFa = ['بایت', 'کیلوبایت', 'مگ', 'گیگ', 'ترابایت'] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  const numStr = (val >= 10 || val % 1 === 0 ? val.toFixed(0) : val.toFixed(1));
  if (lang === 'fa') {
    // convert digits to Persian
    const persianDigits = numStr.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
    return `${persianDigits} ${unitsFa[i]}`;
  }
  return `${numStr} ${unitsEn[i]}`;
};

export const secondsToDHMS = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return { d, h: pad(h), m: pad(m), s: pad(ss) };
};

export const formatDurationCompact = (sec: number, daysShort: string) => {
  const { d, h, m } = secondsToDHMS(sec);
  const dn = Number(d);
  if (dn > 0) return `${dn}${daysShort}`;
  return `${h}:${m}`;
};

export const formatCreatedDate = (date: string | Date, lang: 'fa' | 'en') => {
  try {
    const d = new Date(date);
    if (lang === 'fa') {
      const f = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });
      return f.format(d);
    }
    const f = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    return f.format(d);
  } catch {
    return '—';
  }
};

// Normalize numeric epoch that might be in seconds or milliseconds; return Date or null
export const normalizeEpochToDate = (value: unknown): Date | null => {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const epochMs = num < 1e12 ? num * 1000 : num; // heuristic: treat < ~1e12 as seconds
  const d = new Date(epochMs);
  return isNaN(d.getTime()) ? null : d;
};

// classnames helper (small to avoid extra dep)
export const cn = (...parts: any[]) => parts.filter(Boolean).join(' ');

// Clipboard with fallback to execCommand for older browsers / permission-denied issues.
export async function copyTextAdvanced(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {/* continue to fallback */}
  if (typeof document !== 'undefined' && typeof (document as any).execCommand === 'function') {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = (document as any).execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch {
      return false;
    }
  }
  return false;
}

// Mask subscription name for filename safety: keep alphanumerics & dashes, limit length, fallback token.
export function generateSafeConfFilename(rawName: string | undefined | null): string {
  const base = (rawName || 'client').toString();
  const cleaned = base.normalize('NFKD').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  const truncated = cleaned.slice(0, 40) || 'client';
  // Minimal masking: reveal first 4 & last 2 chars if longer than 10.
  let masked = truncated;
  if (truncated.length > 10) {
    masked = truncated.slice(0,4) + '-x-' + truncated.slice(-2);
  }
  return `digitall-${masked}.conf`;
}

// Fetch with retry, exponential backoff and per-attempt timeout.
// Options:
//  attempts: total attempts including the first (default 3)
//  baseDelay: initial backoff delay ms (default 400)
//  maxDelay: cap delay (default 4000)
//  timeout: per-attempt timeout ms (default 8000)
//  onAttempt: callback(attemptNumber, error?) for observability (attemptNumber starts at 1)
export interface FetchRetryOptions extends RequestInit {
  attempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
  onAttempt?: (attempt: number, err: any | null) => void;
  // Provide external AbortSignal to cancel whole operation
  signal?: AbortSignal;
}

export async function fetchWithRetry(input: RequestInfo | URL, opts: FetchRetryOptions = {}): Promise<Response> {
  const {
    attempts = 3,
    baseDelay = 400,
    maxDelay = 4000,
    timeout = 8000,
    onAttempt,
    signal,
    ...init
  } = opts;
  if (attempts < 1) throw new Error('attempts must be >= 1');
  let lastErr: any = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const attemptController = new AbortController();
    const timeoutId = setTimeout(() => attemptController.abort(), timeout);
    const combinedSignal = signal
      ? mergeAbortSignals(signal, attemptController.signal)
      : attemptController.signal;
    try {
      onAttempt?.(attempt, null);
      const res = await fetch(input, { ...init, signal: combinedSignal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      if (!shouldRetryStatus(res.status)) return res; // non-retryable; surface response
      // retryable
      if (attempt < attempts) {
        lastErr = new Error(`HTTP ${res.status}`);
      } else {
        lastErr = new Error(`HTTP ${res.status}`);
        throw lastErr;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        // If outer signal aborted, propagate immediately
        if (signal?.aborted) throw err;
        lastErr = err; // attempt-level timeout; maybe retry
      } else {
        lastErr = err;
      }
    }
    if (attempt < attempts) {
      const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1)) + jitter(0.25);
      await sleep(delay);
    }
  }
  throw (lastErr || new Error('fetchWithRetry failed'));
}

function shouldRetryStatus(status: number): boolean {
  // Retry on network-like / transient statuses: 408, 429, 500-599
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function jitter(fraction: number) { return Math.random() * fraction * 1000; }

// Merge two abort signals into one (lightweight; we could use AbortSignal.any in modern browsers but keep backwards compat)
function mergeAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof (AbortSignal as any).any === 'function') {
    return (AbortSignal as any).any([a, b]);
  }
  const controller = new AbortController();
  const onAbort = () => {
    if (!controller.signal.aborted) controller.abort();
  };
  a.addEventListener('abort', onAbort, { once: true });
  b.addEventListener('abort', onAbort, { once: true });
  return controller.signal;
}
