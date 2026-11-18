import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { isAndroid } from './platform';

/** Event fired on the Android back button; a component that closes something on back calls preventDefault(). */
export const BACK_EVENT = 'app-back';

/** Android app: back button behaviour and status/navigation bar icons that match the theme. */
export function useAndroidShell(): void {
  const { dark } = useTheme();

  useEffect(() => {
    if (!isAndroid()) return;
    let remove: (() => void) | undefined;
    void import('@capacitor/app').then(({ App }) =>
      App.addListener('backButton', ({ canGoBack }) => {
        // First let an open sheet or dialog close itself.
        if (!window.dispatchEvent(new Event(BACK_EVENT, { cancelable: true }))) return;
        if (canGoBack) window.history.back();
        else void App.exitApp();
      }).then((handle) => {
        remove = () => void handle.remove();
      }),
    ).catch(() => undefined);
    return () => remove?.();
  }, []);

  useEffect(() => {
    if (!isAndroid()) return;
    // "Dark" means light icons on a dark background.
    void import('@capacitor/core')
      .then(({ SystemBars, SystemBarsStyle }) => SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }))
      .catch(() => undefined);
  }, [dark]);
}
