/** True inside the Windows desktop app (Tauri), false in a browser or the installed web app. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
