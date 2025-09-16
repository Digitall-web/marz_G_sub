import { useEffect, useMemo, useRef, useState } from 'react';
// framer-motion no longer directly used in this file after refactor
import { Moon, Sun, Copy, Check, Download, QrCode } from 'lucide-react';
// import { formatBytes } from './utils';
import { useAccount } from './useAccount';
import { AnimatedWGIcon } from './components/AnimatedWGIcon';
import { BatteryUsageBar } from './components/BatteryUsageBar';
import { StatusPill } from './components/StatusPill';
import { Suspense, lazy } from 'react';
const QRModal = lazy(() => import('./components/QRModal').then(m => ({ default: m.QRModal })));
import { Button } from './components/Button';
import { useTheme } from './useTheme';
import { StatusSkeleton } from './components/skeletons/StatusSkeleton';
import { Card } from './components/layout/Card';
import { SectionHeading } from './components/layout/SectionHeading';
import { dictionaries, tFactory } from './i18n';
// Calendar removed per latest request


// Yellow / Orange / Rose / Purple palette (#F9ED69,#F08A5D,#B83B5E,#6A2C70)
// Goal: energetic warm accents with readable surfaces.
const paletteLight = {
  primary: '#6A2C70',       // deep purple for headings
  primaryText: '#4d1f53',   // slightly darker for body text
  surface: '#FFFFFF',
  surfaceAlt: '#FFF9F1',    // warm off white touched by yellow/orange
  border: '#F2E2D6',
  accent: '#B83B5E',        // rose
  accentAlt: '#F08A5D',     // orange
  accentSoft: '#F9ED69',    // soft highlight
  ok: '#16a34a',
  warn: '#F59E0B',
  danger: '#DC2626',
  ringTrack: '#f3e6dd',
  subtle: '#F9ED69',
};
const paletteDark = {
  primary: '#F9ED69',       // bright yellow for headings
  primaryText: '#FFEFB5',   // softer readable yellow
  surface: '#241428',       // deep purple-brown
  surfaceAlt: '#2e1934',    // panel
  border: '#3d2543',
  accent: '#F08A5D',        // orange accent
  accentAlt: '#B83B5E',     // rose alt
  accentSoft: '#6A2C70',    // subdued purple
  ok: '#22c55e',
  warn: '#fbbf24',
  danger: '#f87171',
  ringTrack: '#3c203f',
  subtle: '#6A2C70',
};


// Helpers imported from utils (clipboard advanced + safe filename)
import { copyTextAdvanced, generateSafeConfFilename } from './utils';

// WireGuard config validation
import type { TranslationKey } from './i18n';
interface WGValidation { valid: boolean; issues: TranslationKey[]; }
const base64KeyRegex = /^[A-Za-z0-9+/=]{42,48}$/; // typical 44 chars incl padding
function validateWireGuardConfig(cfg: string): WGValidation {
  const issues: TranslationKey[] = [];
  const lines = cfg.split(/\r?\n/).filter(Boolean);
  const getVal = (k: string) => {
    const line = lines.find(l => l.toLowerCase().startsWith(k.toLowerCase()+ ' ='));
    return line ? line.split('=')[1].trim() : '';
  };
  const priv = getVal('PrivateKey');
  const pub = getVal('PublicKey');
  if (!priv) issues.push('issue_private_missing');
  else if (priv.includes('<') || !base64KeyRegex.test(priv)) issues.push('issue_private_invalid');
  if (!pub) issues.push('issue_public_missing');
  else if (pub.includes('<') || !base64KeyRegex.test(pub)) issues.push('issue_public_invalid');
  return { valid: issues.length === 0, issues };
}

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// dynamic color for usage ring (traffic usage)

export default function App() {
  const { data, loading, error, reload, refreshing } = useAccount();
  const [copied, setCopied] = useState(false); // kept for aria-live only (short state)
  const [qrOpen, setQrOpen] = useState(false);
  const { resolved: resolvedTheme, toggle: toggleTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const [lang, setLang] = useState<'fa' | 'en'>('fa');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrReady, setQrReady] = useState(false);
  const [activeGuide, setActiveGuide] = useState<'android' | 'ios' | 'windows' | 'mac' | 'linux'>('android');
  const [actionLoading, setActionLoading] = useState<{copy:boolean;download:boolean;qr:boolean}>({copy:false,download:false,qr:false});

  // IMPORTANT: compute brand synchronously BEFORE any early return to keep hook order stable
  const brand = dark ? paletteDark : paletteLight;

  const t = tFactory(lang as keyof typeof dictionaries);

  // Dynamic page title based on translation
  useEffect(() => {
    document.title = t('appName');
  }, [lang, t]);

  // (dark mode handled centrally in useTheme)
  // Prepare base values (data may be undefined during loading)
  // Traffic semantics: totalTraffic = consumed so far, dataLimit = quota. Deprecated fields usedTraffic/liveUsedTraffic removed.
  const limit = data?.dataLimit ?? 0;
  const used = data?.totalTraffic ?? 0;
  const usedPct = limit ? used / limit : 0;
  // startDate removed (created date hidden)
  const rawConfig = data?.clientConfig;
  const validation = useMemo(() => rawConfig ? validateWireGuardConfig(rawConfig) : { valid: true, issues: [] as TranslationKey[] }, [rawConfig]);


  // Remaining time only counts after activation (expireDate). When OnHold we show the planned duration length.

  // After all hooks have been called, handle early UI states safely
  if (loading) {
    return (
      <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen p-6">
        <StatusSkeleton />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-sm">
        <div className="px-4 py-2 rounded-md border bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">Error: {error || 'No data'}</div>
        <button onClick={reload} className="px-3 py-1.5 rounded-md border text-xs bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/5">Retry</button>
      </div>
    );
  }

  const preventIfInvalid = async (action: () => void | Promise<void>) => {
    if (!validation.valid) {
      // brief shake / visual feedback could be added; for now just flash copied=false
      return;
    }
    await action();
  };
  // const expireDate = useMemo(() => (data.expireTime ? new Date(data.expireTime * 1000) : null), [data.expireTime]);

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen text-[--txt-color] bg-[--bg-root]" style={{
      ['--bg-root' as any]: dark
        ? 'radial-gradient(circle at 25% 15%, #3a1b40 0%, #241428 55%, #1b0f20 100%)'
        : 'radial-gradient(circle at 75% 10%, #fff5d6 0%, #ffe9df 45%, #ffffff 100%)',
      ['--txt-color' as any]: dark ? '#FFEFB5' : '#44203e'
    }}>
      {/* Live region for announcing copy/download/QR status updates to assistive tech */}
      <div aria-live="polite" className="sr-only" style={{position:'absolute',width:1,height:1,margin:-1,padding:0,overflow:'hidden',clip:'rect(0 0 0 0)',whiteSpace:'nowrap',border:0}}>
        {actionLoading.copy ? t('copying') : (copied ? t('copied') : '')}
      </div>
      {/* Usage top bar */}
      {limit > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden" style={{ background: '#e5e7eb' }}>
          {lang === 'fa' ? (
            <div className="h-full" style={{
              width: `${Math.min(100, usedPct*100).toFixed(1)}%`,
              marginLeft: 'auto',
              background: `linear-gradient(270deg,#16a34a,#f59e0b ${usedPct*100>60? '50%':'100%'},#dc2626)`,
              transition:'width .6s cubic-bezier(.4,0,.2,1)'
            }} />
          ) : (
            <div className="h-full" style={{
              width: `${Math.min(100, usedPct*100).toFixed(1)}%`,
              background: `linear-gradient(90deg,#16a34a,#f59e0b ${usedPct*100>60? '50%':'100%'},#dc2626)`,
              transition:'width .6s cubic-bezier(.4,0,.2,1)'
            }} />
          )}
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur border-b" style={{ borderColor: brand.border, background: dark ? 'rgba(42,22,48,0.78)' : 'rgba(255,255,255,0.75)'}}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <AnimatedWGIcon size={30} className="shrink-0" title="WireGuard" />
              <h1 className="text-xl font-bold truncate" style={{ color: brand.primary }}>
                {data.name || t('appName')}
              </h1>
            </div>
            {(() => {
              const raw = (data as any).createdAt;
              const num = Number(raw);
              if (!raw || !Number.isFinite(num)) return null;
              const ms = num < 1e12 ? num * 1000 : num;
              const d = new Date(ms);
              if (isNaN(d.getTime())) return null;
              if (lang === 'fa') {
                try {
                  const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
                  return <span className="mt-0.5 text-[10px] opacity-70 tracking-wide">{t('created_sentence_prefix')} {fmt} {t('created_sentence_suffix')}</span>;
                } catch {
                  return null;
                }
              } else {
                const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
                return <span className="mt-0.5 text-[10px] opacity-60 tracking-wide">{t('created_sentence_prefix')} {fmt}</span>;
              }
            })()}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => (l === 'fa' ? 'en' : 'fa'))} aria-label="Toggle language" className="text-xs px-2 py-1 rounded-full border bg-white/70 dark:bg-white/5 focus:ring-focus">
              {lang === 'fa' ? 'EN' : 'فا'}
            </button>
            <button onClick={toggleTheme} aria-label="Toggle theme" className="text-xs px-2 py-1 rounded-full border bg-white/70 dark:bg-white/5 focus:ring-focus">
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </header>
  {/* DragonBackdrop removed per requirement */}
  {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-slide-up relative">
        {refreshing && !loading && (
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col gap-4 p-4 bg-gradient-to-b from-white/70 to-white/20 dark:from-black/40 dark:to-black/10 backdrop-blur-[2px]">
            <div className="text-[10px] font-medium animate-pulse self-end px-2 py-1 rounded bg-white/70 dark:bg-white/10 border border-white/30 dark:border-white/5">{t('refreshing')}</div>
          </div>
        )}
        {/* Status Card */}
        <Card className="space-y-6">
          <SectionHeading
            title={t('combined_title')}
            subtitle={lang === 'fa' ? 'وضعیت ترافیک و زمان به‌روزرسانی لحظه‌ای.' : 'Live traffic & time status snapshot.'}
            color={brand.primary}
          >
            {/* ProgressRing removed per request; keeping only the two boxes below */}
          </SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="p-3 rounded-xl border flex flex-col gap-2 justify-between" style={{ borderColor: brand.border, background: dark ? '#341a3a' : brand.surfaceAlt }}>
              <span className="text-xs opacity-60">{t('volume_left')}</span>
              <BatteryUsageBar total={limit} used={used} />
            </div>
            <div className="p-3 rounded-xl border flex flex-col gap-2" style={{ borderColor: brand.border, background: dark ? '#341a3a' : brand.surfaceAlt }}>
              {(() => {
                const lastHs = (data as any).lastHandshake;
                const hasStarted = !!lastHs; // treat any handshake as started
                const rawStatus = data.status as string;
                const effectiveStatus = rawStatus === 'OnHold' && hasStarted ? 'Active' : rawStatus;
                const heading = (() => {
                  if (effectiveStatus === 'Active') return lang === 'fa' ? dictionaries.fa.status_active : dictionaries.en.status_active;
                  if (effectiveStatus === 'Inactive') return lang === 'fa' ? dictionaries.fa.status_inactive : dictionaries.en.status_inactive;
                  return lang === 'fa' ? (dictionaries.fa as any).status_onhold : dictionaries.en.status_onhold;
                })();
                return (
                  <>
                    <span className="text-xs opacity-60">{heading}</span>
                    <StatusPill status={effectiveStatus as any} labels={{
                      Active: lang === 'fa' ? dictionaries.fa.status_active : dictionaries.en.status_active,
                      Inactive: lang === 'fa' ? dictionaries.fa.status_inactive : dictionaries.en.status_inactive,
                      OnHold: lang === 'fa' ? (dictionaries.fa as any).status_onhold_alt : dictionaries.en.status_onhold,
                    }} />
                  </>
                );
              })()}
              {(() => {
                const raw = (data as any).lastHandshake;
                if (!raw) return <span className="text-[10px] opacity-50">{t('last_handshake_never')}</span>;
                // Accept seconds or ms epoch OR ISO string
                let date: Date | null = null;
                if (typeof raw === 'number') {
                  const ms = raw < 1e12 ? raw * 1000 : raw;
                  date = new Date(ms);
                } else if (typeof raw === 'string') {
                  const num = Number(raw);
                  if (Number.isFinite(num)) {
                    const ms = num < 1e12 ? num * 1000 : num;
                    date = new Date(ms);
                  } else {
                    const parsed = new Date(raw);
                    if (!isNaN(parsed.getTime())) date = parsed;
                  }
                }
                if (!date || isNaN(date.getTime())) return <span className="text-[10px] opacity-50">{t('last_handshake_never')}</span>;
                let formatted: string | null = null;
                if (lang === 'fa') {
                  try {
                    if (import.meta.env.PROD) {
                      formatted = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long' }).format(date);
                    } else {
                      formatted = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' }).format(date);
                    }
                  } catch {/* ignore */}
                }
                if (!formatted) {
                  formatted = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
                }
                const hourMin = new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
                return <span className="text-[10px] opacity-70 flex flex-col"><span className="font-medium">{t('last_handshake')}</span><span>{hourMin} • {formatted}</span></span>;
              })()}
            </div>
          </div>
          {/* Time & quota summary (calendar removed) */}
          {(() => {
            const expireRaw = (data as any).expireTime as number | null | undefined;
            const createdRaw = (data as any).createdAt as number | string | null | undefined;
            let createdDate: Date | null = null;
            if (createdRaw) {
              if (typeof createdRaw === 'number') {
                const ms = createdRaw < 1e12 ? createdRaw * 1000 : createdRaw; createdDate = new Date(ms);
              } else {
                const num = Number(createdRaw);
                if (Number.isFinite(num)) { const ms = num < 1e12 ? num * 1000 : num; createdDate = new Date(ms); }
                else { const p = new Date(createdRaw); if (!isNaN(p.getTime())) createdDate = p; }
              }
            }
            let expireDate: Date | null = null;
            if (expireRaw) { const ms = expireRaw < 1e12 ? expireRaw * 1000 : expireRaw; const d = new Date(ms); if (!isNaN(d.getTime())) expireDate = d; }
            const today = new Date(); today.setHours(0,0,0,0);
            let daysLeft: number | null = null;
            if (expireDate) {
              const diff = expireDate.getTime() - today.getTime();
              daysLeft = Math.ceil(diff / 86400000); // if expires later today -> 0 or 1? choose ceil for user-friendly
            }
            const statusLabel = (() => {
              if (!expireDate) return lang === 'fa' ? 'نامحدود' : 'Unlimited';
              if (daysLeft !== null && daysLeft <= 0) return lang === 'fa' ? dictionaries.fa.expired : dictionaries.en.expired;
              return lang === 'fa' ? `${daysLeft} روز باقی` : `${daysLeft}d left`;
            })();
            const createdStr = (() => {
              if (!createdDate) return null;
              if (lang === 'fa') {
                try {
                  const fmt = import.meta.env.PROD
                    ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day:'numeric', month:'long', year:'numeric' }).format(createdDate)
                    : new Intl.DateTimeFormat('fa-IR', { day:'numeric', month:'short', year:'numeric' }).format(createdDate);
                  return `${dictionaries.fa.created_on} ${fmt}`;
                } catch { return null; }
              }
              const fmt = new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short', year:'numeric' }).format(createdDate);
              return `${dictionaries.en.created_on} ${fmt}`;
            })();
            return (
              <div className="mt-2 grid gap-3 sm:grid-cols-3 text-[10px] opacity-80">
                <div className="flex flex-col gap-1">
                  <span className="uppercase tracking-wide opacity-60">{lang==='fa'? 'وضعیت زمان' : 'Time Status'}</span>
                  <span className="text-xs font-semibold">{statusLabel}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="uppercase tracking-wide opacity-60">{lang==='fa'? 'ایجاد' : 'Created'}</span>
                  <span>{createdStr || (lang==='fa'?'—':'—')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="uppercase tracking-wide opacity-60">{lang==='fa'? 'مصرف' : 'Usage'}</span>
                  <span>{limit ? `${(usedPct*100).toFixed(1)}%` : (lang==='fa'?'نامحدود':'Unlimited')}</span>
                </div>
              </div>
            );
          })()}
          {/* Quick Config Actions */}
          <div className="mt-2 flex flex-wrap gap-3">
            <Button
              onClick={async () => preventIfInvalid(async () => { setActionLoading(a=>({...a,copy:true})); const ok = await copyTextAdvanced(data.clientConfig); setCopied(ok); if (ok) { import('./components/Toast').then(m=>m); /* dynamic just in case */ const evt = new CustomEvent('toast', { detail: 'copied' }); document.dispatchEvent(evt);} setTimeout(()=>setCopied(false),1500); setActionLoading(a=>({...a,copy:false})); })}
              disabled={!validation.valid || actionLoading.copy}
              variant="ghost"
              loading={actionLoading.copy}
              title={t(copied ? 'copied' : 'copy_conf_tip')}
              aria-label={t(copied ? 'copied' : 'copy_conf_tip')}
              className={!validation.valid ? 'opacity-40 cursor-not-allowed' : ''}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? t('copied') : (actionLoading.copy ? t('copying') : t('copy_conf'))}</span>
            </Button>
            <Button
              onClick={async () => { if(!validation.valid) return; setActionLoading(a=>({...a,download:true})); const filename = generateSafeConfFilename(data.name); downloadTextFile(filename, data.clientConfig); const evt = new CustomEvent('toast', { detail: 'download_conf' }); document.dispatchEvent(evt); setTimeout(()=>setActionLoading(a=>({...a,download:false})),600); }}
              disabled={!validation.valid || actionLoading.download}
              variant="ghost"
              loading={actionLoading.download}
              title={t('download_conf_tip')}
              aria-label={t('download_conf_tip')}
              className={!validation.valid ? 'opacity-40 cursor-not-allowed' : ''}
            >
              <Download size={14} /> <span>{actionLoading.download ? t('downloading') : t('download_conf')}</span>
            </Button>
            <Button
              onClick={async () => { if (!validation.valid) return; setActionLoading(a=>({...a,qr:true})); setQrOpen(true); if (!qrReady){ const QR = await import('qrcode'); try { await QR.toCanvas(qrCanvasRef.current, data.clientConfig, { errorCorrectionLevel:'M', margin:1, scale:4}); setQrReady(true);} catch{}} setTimeout(()=>setActionLoading(a=>({...a,qr:false})),500); }}
              disabled={!validation.valid || actionLoading.qr}
              variant="ghost"
              loading={actionLoading.qr}
              title={t('show_qr_tip')}
              aria-label={t('show_qr_tip')}
              className={!validation.valid ? 'opacity-40 cursor-not-allowed' : ''}
            >
              <QrCode size={14} /> <span>{actionLoading.qr ? t('generating_qr') : t('show_qr')}</span>
            </Button>
            {!validation.valid && (
              <div className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-md border bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300">
                {t('invalid_config')}
              </div>
            )}
          </div>
          {!validation.valid && (
            <div className="mt-3 text-[10px] leading-relaxed rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/60 dark:bg-red-500/10 p-3 text-red-700 dark:text-red-300 space-y-1">
              <p className="font-semibold">{t('invalid_config_desc')}</p>
              <ul className="list-disc ms-4">
                {validation.issues.map(issueKey => {
                  const key = String(issueKey) as TranslationKey;
                  return <li key={key}>{t(key)}</li>;
                })}
              </ul>
              <p className="opacity-80">{t('cannot_export_invalid')}</p>
            </div>
          )}
  </Card>
        {/* Guides Tabs */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold" style={{ color: brand.primary }}>{t('guide_title')}</h2>
            <div className="flex gap-2 text-[11px] flex-wrap">
              {(['android','ios','windows','mac','linux'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveGuide(key)}
                  aria-label={t(('tab_'+key) as any)}
                  className={`px-2 py-1 rounded-full border transition ${activeGuide === key ? 'bg-[rgb(223,242,235)] dark:bg-white/10' : 'bg-white/40 dark:bg-white/5'}`}
                >{t(('tab_'+key) as any)}</button>
              ))}
            </div>
          </div>
          <div className="text-xs leading-relaxed rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-3">
            <ol className="list-decimal ms-4 space-y-1 whitespace-pre-line">
              {t(('guide_'+activeGuide) as any).split('\n').map((line: string, idx: number) => (
                <li key={idx}>{line}</li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-gray-300/60 dark:border-white/10">
              <button
                onClick={async () => {
                  if (!validation.valid) return; setActionLoading(a=>({...a,copy:true})); const ok = await copyTextAdvanced(data.clientConfig); setCopied(ok); if (ok) { const evt = new CustomEvent('toast', { detail: 'copied' }); document.dispatchEvent(evt); } setTimeout(()=>setCopied(false),1500); setActionLoading(a=>({...a,copy:false}));
                }}
                disabled={!validation.valid || actionLoading.copy}
                title={t(copied ? 'copied' : 'copy_conf_tip')}
                aria-label={t(copied ? 'copied' : 'copy_conf_tip')}
                className={`text-[10px] px-2 py-1 rounded-full border ${!validation.valid? 'opacity-40 cursor-not-allowed':'bg-white/70 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10'}`}
              >{actionLoading.copy ? t('copying') : (copied ? t('copied') : t('copy_conf'))}</button>
              <button
                onClick={() => { if(!validation.valid) return; const filename = generateSafeConfFilename(data.name); downloadTextFile(filename, data.clientConfig); const evt = new CustomEvent('toast', { detail: 'download_conf' }); document.dispatchEvent(evt); }}
                disabled={!validation.valid}
                aria-label={t('download_conf_tip')}
                className={`text-[10px] px-2 py-1 rounded-full border ${!validation.valid? 'opacity-40 cursor-not-allowed':'bg-white/70 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10'}`}
              >{t('download_conf')}</button>
              <button
                onClick={async () => { if (!validation.valid) return; setQrOpen(true); if (!qrReady){ const QR = await import('qrcode'); try { await QR.toCanvas(qrCanvasRef.current, data.clientConfig, { errorCorrectionLevel:'M', margin:1, scale:4}); setQrReady(true);} catch{}}}}
                disabled={!validation.valid}
                aria-label={t('show_qr_tip')}
                className={`text-[10px] px-2 py-1 rounded-full border ${!validation.valid? 'opacity-40 cursor-not-allowed':'bg-white/70 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10'}`}
              >{t('show_qr')}</button>
              {!validation.valid && (
                <span className="text-[10px] px-2 py-1 rounded-full border bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300">{t('invalid_config')}</span>
              )}
            </div>
          </div>
  </Card>
        <Suspense fallback={null}>
          <QRModal open={qrOpen} onClose={() => setQrOpen(false)} config={data.clientConfig} title="WireGuard QR" closeLabel={t('close')} />
        </Suspense>
      </main>
    </div>
  );
}
