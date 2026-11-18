import { useEffect, useState } from 'react';
import { getNativeShell, type NativeShell } from '../native';
import { dismissUpdate, findUpdate } from '../native/updates';

/** Windows and Android apps: tells the user when a newer version of their app is on GitHub. */
export default function UpdateNotice() {
  const [shell, setShell] = useState<NativeShell | null>(null);
  const [update, setUpdate] = useState<{ tag: string; url: string } | null>(null);

  useEffect(() => {
    void getNativeShell().then(async (s) => {
      if (!s) return;
      setShell(s);
      setUpdate(await findUpdate(__APP_VERSION__, s.releasePrefix));
    });
  }, []);

  if (!shell || !update) return null;
  return (
    <div role="status" className="mx-auto mb-5 flex max-w-5xl flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-100 px-4 py-3 text-sm text-sky-800">
      <span className="flex-1">
        A new version ({update.tag.slice(shell.releasePrefix.length - 1)}) is available. You have v{__APP_VERSION__}. Install it over this one; your data stays.
      </span>
      <button type="button" className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800" onClick={() => void shell.openInBrowser(update.url)}>
        Download
      </button>
      <button
        type="button"
        className="rounded-lg px-3 py-1.5 hover:bg-sky-200"
        onClick={() => {
          dismissUpdate(shell.releasePrefix, update.tag);
          setUpdate(null);
        }}
      >
        Not now
      </button>
    </div>
  );
}
