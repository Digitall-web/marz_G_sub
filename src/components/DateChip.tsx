import React from 'react';
import dayjs from 'dayjs';
// Conditionally load jalaliday + fa locale only in production build to avoid test env resolution issues
let jalaliEnabled = false;
if (import.meta.env && import.meta.env.PROD) {
  try {
    // dynamic requires to avoid bundling in test context until build
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const jalaliday = require('jalaliday').default || require('jalaliday');
    dayjs.extend(jalaliday);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dayjs/locale/fa.js');
    jalaliEnabled = true;
  } catch {
    // silently ignore; fallback formatting will apply
    jalaliEnabled = false;
  }
}

interface DateChipProps {
  date: Date | string | number | null | undefined;
  lang: 'fa' | 'en';
  className?: string;
}

export const DateChip: React.FC<DateChipProps> = ({ date, lang, className = '' }) => {
  if (!date) return null;
  const d = dayjs(date);
  if (!d.isValid()) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border font-medium tracking-wide ${className}`}
        style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'var(--color-border)', color: 'var(--color-danger)' }}>
        {lang === 'fa' ? 'نامعتبر' : 'Invalid'}
      </span>
    );
  }
  let formatted: string;
  if (lang === 'fa') {
    if (jalaliEnabled) {
      try {
        // @ts-ignore calendar added by jalaliday
        formatted = (d as any).calendar('jalali').locale('fa').format('YYYY/MM/DD');
      } catch {
        formatted = d.format('YYYY/MM/DD');
      }
    } else {
      formatted = d.format('YYYY/MM/DD');
    }
  } else {
    formatted = d.format('YYYY-MM-DD');
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border font-medium tracking-wide ${className}`}
      style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}>
      {formatted}
    </span>
  );
};
