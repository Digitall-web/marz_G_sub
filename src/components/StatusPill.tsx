import React from 'react';

export type StatusKind = 'Active' | 'Inactive' | 'OnHold';

interface StatusPillProps {
  status: StatusKind;
  labels?: Partial<Record<StatusKind,string>>;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, labels, className = '' }) => {
  const label = labels?.[status] || status;
  let extraClass = '';
  if (status === 'Active') extraClass = 'active';
  else if (status === 'OnHold') extraClass = 'onhold';
  else extraClass = 'inactive';
  return <span className={`status-pill ${extraClass} ${className}`}>{label}</span>;
};
