import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  config: string;
  title?: string;
  closeLabel?: string;
}

export const QRModal: React.FC<QRModalProps> = ({ open, onClose, config, title = 'WireGuard QR', closeLabel = 'Close' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Generate QR when opened
  useEffect(() => {
    if (open && canvasRef.current) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      (async () => {
        const QR = await import('qrcode');
        try { await QR.toCanvas(canvasRef.current, config, { errorCorrectionLevel: 'M', margin: 1, scale: 4 }); } catch {/* ignore */}
      })();
      // focus first focusable (close btn)
      setTimeout(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
        first?.focus();
      }, 20);
    }
    if (!open && previouslyFocused.current) {
      previouslyFocused.current.focus();
    }
  }, [open, config]);

  // ESC to close
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'Tab' && dialogRef.current) {
      // basic focus trap
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    }
  }, [open, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div ref={dialogRef} className="w-full max-w-sm glass rounded-2xl p-5 shadow-glass space-y-4 border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            role="dialog" aria-modal="true" aria-labelledby="qr-dialog-title" aria-describedby="qr-dialog-desc"
          >
            <div className="flex items-center justify-between">
              <h3 id="qr-dialog-title" className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>{title}</h3>
              <button onClick={onClose} className="btn btn-ghost text-[10px] px-2 py-1" aria-label={closeLabel}>✕</button>
            </div>
            <div className="flex items-center justify-center">
              <canvas ref={canvasRef} className="rounded-md border" />
            </div>
            <div id="qr-dialog-desc" className="text-[10px] opacity-60 leading-relaxed ltr:break-all rtl:break-all max-h-24 overflow-auto p-2 rounded bg-black/5 dark:bg-white/5 border border-white/10">
              {config}
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn btn-primary text-xs px-3 py-1.5 min-w-[90px]">{closeLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
