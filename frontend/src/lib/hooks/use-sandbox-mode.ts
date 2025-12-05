'use client';

import { useState, useEffect } from 'react';

type Mode = 'sandbox' | 'production';

export function useSandboxMode(): [Mode, (mode: Mode) => void] {
  const [mode, setModeState] = useState<Mode>('sandbox');

  useEffect(() => {
    const stored = localStorage.getItem('fluxpay-mode');
    if (stored === 'production' || stored === 'sandbox') {
      setModeState(stored);
    }
  }, []);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('fluxpay-mode', newMode);
  };

  return [mode, setMode];
}
