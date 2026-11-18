// Detection only: no Tauri or Capacitor code is loaded by this file.

type NativeKind = 'desktop' | 'android';

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

/** 'desktop' inside the Windows app, 'android' inside the Android app, null on the web. */
export function nativeKind(): NativeKind | null {
  if (typeof window === 'undefined') return null;
  if ('__TAURI_INTERNALS__' in window) return 'desktop';
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (cap?.isNativePlatform?.() && cap.getPlatform?.() === 'android') return 'android';
  // Development only: lets the Android code paths run in a normal browser for testing.
  if (import.meta.env.DEV && safeFlag('simulate-android')) return 'android';
  return null;
}

export const isDesktop = () => nativeKind() === 'desktop';
export const isAndroid = () => nativeKind() === 'android';

function safeFlag(name: string): boolean {
  try {
    return localStorage.getItem(name) === '1';
  } catch {
    return false;
  }
}
