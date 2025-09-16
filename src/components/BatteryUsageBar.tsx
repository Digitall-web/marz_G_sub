import React from 'react';
import { dictionaries } from '../i18n';

interface BatteryUsageBarProps {
  total: number; // total bytes limit
  used: number; // used bytes
  className?: string;
  showPercent?: boolean;
}

function formatBytesSmart(bytes: number, lang: 'fa' | 'en'): string {
  if (!bytes) return lang === 'fa' ? '۰' + (dictionaries.fa.unit_byte) : '0' + (dictionaries.en.unit_byte);
  const table = [
    { unit: 'unit_byte', v: 1 },
    { unit: 'unit_kb', v: 1024 },
    { unit: 'unit_mb', v: 1024 ** 2 },
    { unit: 'unit_gb', v: 1024 ** 3 },
    { unit: 'unit_tb', v: 1024 ** 4 },
  ] as const;
  let value = bytes;
  let picked: typeof table[number] = table[0];
  for (let i=1;i<table.length;i++) {
    if (bytes >= table[i].v) picked = table[i]; else break;
  }
  value = bytes / picked.v;
  const isFa = lang === 'fa';
  const dict = (dictionaries as any)[lang];
  const unitLabel = dict[picked.unit];
  const num = value < 10 ? value.toFixed(1) : Math.round(value).toString();
  const localizedNum = isFa ? num.replace(/[0-9]/g,d=> '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : num;
  // For Persian add space if long unit
  const spacer = isFa ? ' ' : '';
  return localizedNum + spacer + unitLabel;
}

export const BatteryUsageBar: React.FC<BatteryUsageBarProps> = ({ total, used, className = '', showPercent = true }) => {
  const pct = total > 0 ? Math.min(1, used / total) : 0;
  const over = used > total;
  const remaining = Math.max(0, total - used);
  const isFa = typeof document !== 'undefined' && document.documentElement.getAttribute('dir') === 'rtl';
  const lang: 'fa' | 'en' = isFa ? 'fa' : 'en';
  const dict = (dictionaries as any)[lang];
  const labelData = dict.label_data;
  const labelLeft = dict.label_left;
  const labelOver = dict.label_over;
  return (
    <div className={`flex flex-col gap-1 ${className}`}> 
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide opacity-70">
        <span>{labelData}</span>
        <span>{formatBytesSmart(used, lang)} / {formatBytesSmart(total, lang)}</span>
      </div>
      <div
        className="relative h-5 rounded-xl overflow-hidden group"
        style={{ background: 'linear-gradient(120deg,rgba(255,255,255,0.35),rgba(255,255,255,0.15))', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${formatBytesSmart(used, lang)} / ${formatBytesSmart(total, lang)}`}
        aria-label={labelData}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700 ease-brand"
          style={{
            width: `${Math.min(100, pct * 100)}%`,
            background: over
              ? 'repeating-linear-gradient(45deg, var(--color-danger) 0 8px, color-mix(in srgb,var(--color-danger) 70%, transparent) 8px 16px)'
              : 'linear-gradient(90deg,var(--color-success), var(--color-secondary))',
            filter: over ? 'brightness(1.05)' : undefined,
          }}
        />
        {showPercent && total > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-semibold text-white drop-shadow-sm" aria-label={dict.percent_used}>
              {(() => {
                const raw = (pct*100).toFixed(pct*100 < 10 ? 1 : 0);
                if (lang === 'fa') {
                  return raw.replace(/[0-9]/g,d=> '۰۱۲۳۴۵۶۷۸۹'[Number(d)]).replace('.', '٫') + '%';
                }
                return raw + '%';
              })()}
            </span>
          </div>
        )}
        {/* Tooltip anchored to right edge of fill */}
        <div
          className="pointer-events-none absolute -top-7 text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition origin-bottom bg-black/80 text-white"
          style={{ left: `${Math.min(100, pct * 100)}%`, transform: 'translateX(-50%)' }}
        >
          {formatBytesSmart(used, lang)} / {formatBytesSmart(total, lang)} ({lang==='fa' ? (pct*100).toFixed(1).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]).replace('.', '٫') : (pct*100).toFixed(1)}%)
        </div>
        {over && (
          <div className="absolute inset-0 animate-pulse-soft flex items-center justify-center text-[10px] font-semibold text-white/90 tracking-wide" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>{labelOver}</div>
        )}
      </div>
      <div className="text-[10px] opacity-60 flex justify-between">
        <span>{labelLeft}</span>
        <span>{formatBytesSmart(remaining, lang)}</span>
      </div>
    </div>
  );
};
