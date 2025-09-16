import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dictionaries } from '../i18n';
import { cn } from '../utils';

interface ToastItem { id: number; msg: string; ttl: number; }
interface ToastContextValue { show: (msg: string, ttl?: number) => void; }
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

let idSeq = 1;

// Basic sanitizer: strip angle brackets to avoid accidental HTML injection in dangerouslySetInnerHTML contexts (we only use text). 
function sanitize(msg: string) { return msg.replace(/[<>]/g, ''); }

export const ToastProvider: React.FC<{ children: any }>= ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((msg: string, ttl = 2200) => {
    const item: ToastItem = { id: idSeq++, msg: sanitize(msg), ttl };
    setToasts(t => [...t, item]);
  }, []);
  // Listen for custom events dispatched from components (detail is i18n key)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      const key = ce.detail;
      // attempt fa then en
      const fa = (dictionaries as any).fa?.[key];
      const en = (dictionaries as any).en?.[key];
      show(fa || en || key);
    };
    document.addEventListener('toast', handler as any);
    return () => document.removeEventListener('toast', handler as any);
  }, [show]);
  // Auto remove
  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map(t => setTimeout(() => {
      setToasts(list => list.filter(i => i.id !== t.id));
    }, t.ttl));
    return () => { timers.forEach(clearTimeout); };
  }, [toasts]);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 inset-x-0 pointer-events-none flex flex-col items-center gap-2 z-[100]">
        {toasts.map(t => (
          <div key={t.id} className={cn('px-3 py-2 rounded-md shadow text-xs font-medium bg-neutral-900/90 text-white dark:bg-neutral-100 dark:text-neutral-900 border border-white/10 dark:border-neutral-300/40 backdrop-blur-sm animate-fade-slide-up')}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
