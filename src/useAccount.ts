import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWithRetry } from './utils';

// Derive a loose TypeScript interface (can be tightened when backend schema finalizes)
export interface AccountData {
  id: number;
  name: string;
  interfaceName?: string;
  interfaceEndpoint?: string;
  interfacePublicKey?: string;
  publicKey?: string;
  privateKey?: string;
  presharedKey?: string | null;
  allowedIps?: string;
  dns?: string;
  mtu?: number;
  persistentKeepalive?: number;
  expireTime: number | null;
  status: string;
  dataLimit?: number;
  totalTraffic?: number;
  lastHandshake?: string | null;
  createdAt: string;
  clientConfig: string;
  subscribeLink?: string;
  onHoldExpireDuration?: number;
  // Accept any extra fields without TS complaints
  [k: string]: any;
}

export interface UseAccountResult {
  data: AccountData | null;
  loading: boolean; // initial load
  refreshing: boolean; // subsequent reloads
  error: string | null;
  reload: () => void;
  token: string | null;
  apiUrl: string | null;
}

function readQueryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function extractToken(): string | null {
  const fromQuery = readQueryParam('sub');
  if (fromQuery) return fromQuery;
  // Try path pattern /sub/<token>
  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex(p => p.toLowerCase() === 'sub');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  }
  return null;
}

function extractApi(): string | null {
  const api = readQueryParam('api');
  if (api) return api;
  return null;
}

export function useAccount(): UseAccountResult {
  const [token, setToken] = useState<string | null>(() => extractToken());
  const [apiUrl, setApiUrl] = useState<string | null>(() => extractApi());
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    const key = `${apiUrl || ''}|${token || ''}`;
    if (!force && lastKeyRef.current === key) return; // prevent duplicate in StrictMode second render
    lastKeyRef.current = key;
    // Cancel previous (for navigation changes) but we'll avoid rapid abort/create loops
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setLoading(true);
    setError(null);
    try {
      // Build base URL
      let baseUrl: string | null = null;
      if (apiUrl) {
        baseUrl = apiUrl.endsWith('/info') ? apiUrl.slice(0, -5) : apiUrl; // remove trailing /info if present
      } else {
        if (!token) throw new Error('Missing token (sub)');
  const base = (import.meta as any).env?.VITE_API_BASE || 'https://api.samanii.com';
  if (!base) console.warn('[useAccount] VITE_API_BASE not set; falling back to default https://api.samanii.com');
        const baseClean = base.replace(/\/$/, '');
        baseUrl = base ? `${baseClean}/sub/${token}` : `/sub/${token}`;
      }
      const infoUrl = baseUrl + '/info';
      let finalData: any = null;
      // Try info first
      let infoOk = false;
      try {
        const infoRes = await fetchWithRetry(infoUrl, { signal: abort.signal, headers: { 'Accept': 'application/json' }, attempts: 3, timeout: 6000 });
        if (infoRes.ok) {
          finalData = await infoRes.json();
          infoOk = true;
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return; // stop
      }
      // Fallback to base if info missing or empty
      if (!infoOk) {
        const baseRes = await fetchWithRetry(baseUrl, { signal: abort.signal, headers: { 'Accept': 'application/json' }, attempts: 3, timeout: 6000 });
        if (!baseRes.ok) throw new Error(`HTTP ${baseRes.status}`);
        finalData = await baseRes.json();
      } else {
        // If we got info, optionally enrich with base (non-conflicting fields only)
        try {
          const baseRes = await fetchWithRetry(baseUrl, { signal: abort.signal, headers: { 'Accept': 'application/json' }, attempts: 2, timeout: 5000 });
          if (baseRes.ok) {
            const baseJson = await baseRes.json();
            finalData = { ...baseJson, ...finalData }; // info overrides
          }
        } catch {/* ignore enrich errors */}
      }
      if (!finalData) throw new Error('No data received');
      setData(finalData);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      // Friendly network timeouts / censorship style message (fa/en heuristics)
      const lang = (navigator.language || 'en').startsWith('fa') ? 'fa' : 'en';
      let friendly: string | null = null;
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('timeout') || msg.includes('failed') || msg.includes('network') || msg.includes('dns') || msg.includes('cors') || msg.includes('blocked')) {
        friendly = lang === 'fa'
          ? 'خطا در ارتباط با سرور. ممکنه به خاطر اختلال شبکه یا فیلترینگ باشد؛ بعداً دوباره تلاش کنید یا VPN مرورگر را روشن کنید.'
          : 'Network error contacting server. It may be temporary blocking/censorship; retry later or enable a browser VPN.';
      }
      setError(friendly || e.message || 'Fetch failed');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Expose debug helpers for manual testing in console
  useEffect(() => {
    (window as any).setSub = (t: string) => { setToken(t); };
    (window as any).setApi = (u: string) => { setApiUrl(u); };
    (window as any).reloadAccount = () => fetchData(true);
  }, [fetchData]);

  // Live apply URL ?sub= and ?api= changes (do not push history). We observe:
  // - popstate (back/forward)
  // - periodic lightweight polling of location.search (cheap)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastSearch = window.location.search;
    const check = () => {
      const current = window.location.search;
      if (current === lastSearch) return;
      lastSearch = current;
      const newSub = readQueryParam('sub');
      const newApi = readQueryParam('api');
      setToken(prev => (newSub !== null && newSub !== prev ? newSub : prev));
      setApiUrl(prev => (newApi !== null && newApi !== prev ? newApi : prev));
    };
    const onPop = () => {
      check();
    };
    window.addEventListener('popstate', onPop);
    const interval = window.setInterval(check, 2000);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.clearInterval(interval);
    };
  }, []);

  return { data, loading, refreshing, error, reload: fetchData, token, apiUrl };
}
