import React from 'react';
import { Card } from '../layout/Card';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent dark:before:via-white/10';

export const StatusSkeleton: React.FC = () => {
  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap gap-6 items-start justify-between">
        <div className="space-y-2 w-56">
          <div className={`h-5 w-40 rounded bg-white/40 dark:bg-white/10 ${shimmer}`} />
          <div className={`h-3 w-48 rounded bg-white/30 dark:bg-white/5 ${shimmer}`} />
        </div>
        <div className="flex gap-8 items-center">
          <div className={`rounded-full ${shimmer}`} style={{ width:110, height:110, background:'rgba(255,255,255,0.2)' }} />
          <div className="flex flex-col gap-2">
            <div className={`h-3 w-20 rounded bg-white/30 dark:bg-white/5 ${shimmer}`} />
            <div className={`h-4 w-24 rounded bg-white/40 dark:bg-white/10 ${shimmer}`} />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        {[0,1].map(i => (
          <div key={i} className={`p-3 rounded-xl border flex flex-col gap-2`} style={{ borderColor: 'var(--color-border)', background:'rgba(255,255,255,0.3)' }}>
            <div className={`h-3 w-24 rounded bg-white/40 dark:bg-white/10 ${shimmer}`} />
            <div className={`h-5 w-32 rounded bg-white/30 dark:bg-white/5 ${shimmer}`} />
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {[0,1,2].map(i => <div key={i} className={`h-8 w-28 rounded-full border bg-white/40 dark:bg-white/10 ${shimmer}`} />)}
      </div>
    </Card>
  );
};

// keyframes for shimmer (fallback if not in tailwind config)
// Add in global CSS if desired
