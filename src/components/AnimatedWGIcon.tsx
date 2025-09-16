import React, { useState, useCallback } from 'react';

interface AnimatedWGIconProps { size?: number; className?: string; title?: string; }

// Replaced per user request: use official WireGuard SVG via CDN (no local animation).
// Keeping component name & API stable so existing imports/tests keep working.
// If offline fallback is desired later, we can add a <picture> with an inline SVG fallback.
export const AnimatedWGIcon: React.FC<AnimatedWGIconProps> = ({ size = 40, className = '', title = 'WireGuard' }) => {
  const cdnSrc = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/wireguard.svg';
  const localSrc = '/src/assets/wireguard-local.svg'; // served by dev; for prod ensure asset pipeline copies it (Vite will inline if imported)
  const [src, setSrc] = useState<string>(cdnSrc);
  const onError = useCallback(() => {
    if (src !== localSrc) setSrc(localSrc);
  }, [src]);
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={className}
      alt={title}
      loading="lazy"
      onError={onError}
      style={{ display: 'inline-block', width: size, height: size }}
    />
  );
};
