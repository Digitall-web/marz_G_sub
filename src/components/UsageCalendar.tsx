import React, { useMemo } from 'react';

export interface UsageCalendarProps {
  expireEpoch?: number | null; // seconds
  lang: 'fa' | 'en';
  todayOverride?: Date; // for tests
}

// Helper: normalize epoch seconds or ms
function toDate(epoch?: number | null): Date | null {
  if (!epoch) return null;
  const ms = epoch < 1e12 ? epoch * 1000 : epoch;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

export const UsageCalendar: React.FC<UsageCalendarProps> = ({ expireEpoch, lang, todayOverride }) => {
  const expireDate = toDate(expireEpoch);
  const today = useMemo(() => {
    const base = todayOverride ? new Date(todayOverride) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), base.getDate());
  }, [todayOverride]);

  const days = useMemo(() => {
    if (!expireDate) return [] as Date[];
    const end = new Date(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate());
    if (end.getTime() < today.getTime()) return [] as Date[]; // already expired
    const list: Date[] = [];
    let cursor = new Date(today);
    const maxSpan = 60; // cap to 60 days display
    let count = 0;
    while (cursor.getTime() <= end.getTime() && count < maxSpan) {
      list.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
      count++;
    }
    // If trimmed, ensure expiration day included
    if (cursor.getTime() <= end.getTime() && list[list.length - 1]?.getTime() !== end.getTime()) {
      list.push(end); // append end explicitly
    }
    return list;
  }, [expireDate, today]);

  const dir = lang === 'fa' ? 'rtl' : 'ltr';
  const useJalali = lang === 'fa' && (import.meta as any).env?.PROD; // only in prod for fa
  const monthFormatter = (date: Date) => {
    try {
      if (useJalali) return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long' }).format(date);
      return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', { month: 'long' }).format(date);
    } catch { return ''; }
  };
  const dayFormatter = (date: Date) => {
    try {
      if (useJalali) return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(date);
      return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', { day: 'numeric' }).format(date);
    } catch { return ''; }
  };

  if (!expireDate) {
    return <div className="text-[10px] opacity-60" dir={dir}>{lang === 'fa' ? 'تاریخ پایان نامشخص' : 'No expiration date'}</div>;
  }
  if (!days.length) {
    return <div className="text-[10px] opacity-60" dir={dir}>{lang === 'fa' ? 'منقضی شده' : 'Expired'}</div>;
  }

  // Group by month for label
  const calendarMonth = monthFormatter(days[0]) + (days.some(d => d.getMonth() !== days[0].getMonth()) ? ' …' : '');
  const expirationDayMs = new Date(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate()).getTime();

  return (
    <div className="flex flex-col gap-2" dir={dir}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide opacity-70">
        <span>{lang === 'fa' ? 'روزهای دسترسی' : 'Access Days'}</span>
        <span className="opacity-60">{calendarMonth}</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {days.map(d => {
          const time = d.getTime();
            const isExpire = time === expirationDayMs;
            const label = dayFormatter(d);
            return (
              <div
                key={time}
                className="h-6 rounded-md text-[10px] flex items-center justify-center font-medium shadow-sm"
                style={{
                  background: isExpire ? 'var(--color-danger)' : 'var(--color-success)',
                  color: '#fff',
                  opacity: isExpire ? 0.95 : 0.85,
                }}
                title={isExpire ? (lang === 'fa' ? 'روز پایان' : 'Expiration day') : (lang === 'fa' ? 'قابل استفاده' : 'Available')}
              >
                {label}
              </div>
            );
        })}
      </div>
      {days.length > 60 && (
        <div className="text-[10px] opacity-50">{lang === 'fa' ? 'نمایش تا ۶۰ روز نخست (باقی مخفی)' : 'Showing first 60 days (rest hidden)'}</div>
      )}
      <div className="flex gap-3 items-center mt-1">
        <div className="flex items-center gap-1 text-[10px] opacity-70"><span className="inline-block w-3 h-3 rounded-sm" style={{background:'var(--color-success)'}} />{lang === 'fa' ? 'دسترسی' : 'Available'}</div>
        <div className="flex items-center gap-1 text-[10px] opacity-70"><span className="inline-block w-3 h-3 rounded-sm" style={{background:'var(--color-danger)'}} />{lang === 'fa' ? 'پایان' : 'Expire'}</div>
      </div>
    </div>
  );
};

export default UsageCalendar;