import React from 'react';
import { cn } from '../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'soft';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ variant='primary', size='md', loading=false, className='', children, ...rest }) => {
  const base = 'btn focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const v = variant === 'primary'
    ? 'btn-primary'
    : variant === 'ghost'
      ? 'btn-ghost'
      : 'btn-ghost';
  const s = size === 'sm' ? 'text-[11px] px-3 py-1.5' : 'text-xs px-4 py-2';
  return (
    <button className={cn(base, v, s, className)} {...rest}>
      {loading && <span className="w-3 h-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />}
      {children}
    </button>
  );
};
