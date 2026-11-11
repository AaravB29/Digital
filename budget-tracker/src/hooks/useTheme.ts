import { useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'budget-tracker-theme';
const listeners = new Set<() => void>();
let preference: ThemePreference = readPreference();

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  // A host page (e.g. a preview frame) may state its theme on the root element.
  const host = document.documentElement.getAttribute('data-theme');
  if (host === 'dark' || host === 'light') return host === 'dark';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function isDark(): boolean {
  return preference === 'dark' || (preference === 'system' && systemPrefersDark());
}

function apply() {
  const dark = isDark();
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#0f766e');
  listeners.forEach((l) => l());
}

/** Call once before the first render, so the page never flashes the wrong theme. */
export function initTheme(): void {
  apply();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', apply);
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export function setThemePreference(next: ThemePreference): void {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode or blocked storage: the choice still applies until the page closes.
  }
  apply();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, isDark);
  const pref = useSyncExternalStore(subscribe, () => preference);
  return { dark, preference: pref, setPreference: setThemePreference };
}
