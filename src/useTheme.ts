import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  resolved: 'light' | 'dark'; // actual applied theme
  mode: ThemeMode;            // user preference
  setMode: (m: ThemeMode) => void;
  toggle: () => void;         // cycle light/dark (ignores system)
}

const STORAGE_KEY = 'theme'; // stores only explicit light|dark; system = absence

function getSystemPref(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readInitial(): { mode: ThemeMode; resolved: 'light' | 'dark' } {
  if (typeof window === 'undefined') return { mode: 'light', resolved: 'light' };
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null;
    if (stored === 'light' || stored === 'dark') {
      return { mode: stored, resolved: stored };
    }
    const sys = getSystemPref();
    return { mode: 'system', resolved: sys };
  } catch {
    return { mode: 'system', resolved: getSystemPref() };
  }
}

export function useTheme(): UseThemeReturn {
  const [{ mode, resolved }, setState] = useState(readInitial);

  // apply class + meta tag
  useEffect(() => {
    const root = document.documentElement;
    const isDark = resolved === 'dark';
    root.classList.toggle('dark', isDark);
    // animate transition if already painted
    root.classList.add('theme-transition');
    const t = setTimeout(() => root.classList.remove('theme-transition'), 650);

    const meta = document.getElementById('meta-theme-color');
    if (meta) {
      meta.setAttribute('content', isDark ? '#0e1726' : '#DFF2EB');
    }
    return () => clearTimeout(t);
  }, [resolved]);

  // listen for system changes if mode===system
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      setState(s => ({ ...s, resolved: mq.matches ? 'dark' : 'light' }));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setState(prev => {
      let resolved: 'light' | 'dark';
      if (m === 'system') {
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        resolved = getSystemPref();
      } else {
        try { localStorage.setItem(STORAGE_KEY, m); } catch {}
        resolved = m;
      }
      return { mode: m, resolved };
    });
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setMode]);

  return { mode, resolved, setMode, toggle };
}
