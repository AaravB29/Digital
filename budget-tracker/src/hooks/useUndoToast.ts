import { useCallback, useEffect, useRef, useState } from 'react';

export interface UndoToastState {
  id: number;
  message: string;
  onUndo: () => void;
}

const TOAST_MS = 6000;

/** One toast at a time; a new one replaces the old. Hides itself after a few seconds. */
export function useUndoToast() {
  const [toast, setToast] = useState<UndoToastState | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const show = useCallback((message: string, onUndo: () => void) => {
    counter.current += 1;
    setToast({ id: counter.current, message, onUndo });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, show, dismiss };
}
