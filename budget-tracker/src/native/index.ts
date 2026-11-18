import type { NativeShell } from './types';
import { nativeKind } from './platform';

let shell: Promise<NativeShell | null> | null = null;

/** The platform's native features, loaded on first use; null on the web. */
export function getNativeShell(): Promise<NativeShell | null> {
  if (!shell) {
    const kind = nativeKind();
    shell =
      kind === 'desktop'
        ? import('./desktop').then((m) => m.desktopShell)
        : kind === 'android'
          ? import('./android').then((m) => m.androidShell)
          : Promise.resolve(null);
  }
  return shell;
}

export { nativeKind, isAndroid, isDesktop } from './platform';
export type { NativeShell } from './types';
