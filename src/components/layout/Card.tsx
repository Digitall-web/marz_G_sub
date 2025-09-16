import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle';
}

export const Card: React.FC<CardProps> = ({ variant='default', className='', ...rest }) => {
  const base = 'rounded-2xl border p-5 space-y-6 shadow-soft glass-card dark:glass-card-dark';
  const subtle = variant === 'subtle' ? 'shadow-none backdrop-blur-sm' : '';
  return <div className={`${base} ${subtle} ${className}`} {...rest} />;
};
