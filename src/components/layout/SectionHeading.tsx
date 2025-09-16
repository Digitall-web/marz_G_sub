import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'start' | 'center' | 'between';
  children?: React.ReactNode; // for action buttons
  color?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, align='between', children, color='var(--color-primary)' }) => {
  const layout = align === 'center' ? 'flex-col items-center text-center' : 'items-start';
  return (
    <div className={`flex ${align==='between'?'items-start justify-between flex-wrap gap-4':'flex-col'} ${layout}`}>
      <div>
        <h2 className="text-lg font-semibold" style={{ color }}>{title}</h2>
        {subtitle && <p className="text-xs opacity-70 mt-1 max-w-prose">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};
