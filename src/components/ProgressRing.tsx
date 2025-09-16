import { motion } from 'framer-motion';
import React from 'react';

interface ProgressRingProps {
  size?: number;
  stroke?: number;
  progress: number; // 0..1
  trackColor?: string;
  color?: string;
  label?: string;
  className?: string;
  pause?: boolean; // if true (OnHold) show static
  rtl?: boolean; // new: if true fill direction reversed
  labelLeft?: string; // i18n label for remaining
  labelOver?: string; // i18n label for overage
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 110,
  stroke = 10,
  progress,
  trackColor = 'rgba(255,255,255,0.25)',
  color = 'var(--color-secondary)',
  label,
  className = '',
  pause = false,
  rtl = false,
  labelLeft,
  labelOver,
}) => {
  const pct = Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (1 - pct) * circ;
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="drop-shadow-sm" style={rtl?{transform:'scaleX(-1)'}:undefined}>
          <circle cx={size/2} cy={size/2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
          <motion.circle
            cx={size/2}
            cy={size/2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            initial={false}
            animate={ pause ? { strokeDasharray: circ, strokeDashoffset: dash } : { strokeDasharray: circ, strokeDashoffset: dash } }
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold" style={{ color }}>
          {Math.round(pct * 100)}%
        </div>
      </div>
      {label && <span className="text-xs opacity-70">{label}</span>}
      {(labelLeft || labelOver) && (
        <div className="flex gap-2 text-[10px] opacity-60">
          {labelLeft && <span>{labelLeft}</span>}
          {labelOver && <span>{labelOver}</span>}
        </div>
      )}
    </div>
  );
};
