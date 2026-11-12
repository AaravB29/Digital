import { useEffect, useState } from 'react';
import { isDesktop } from '../desktop/platform';
import { dismissUpdate, findUpdate } from '../desktop/updates';
import { openInBrowser } from '../desktop/files';

/** Desktop app only: tells the user when a newer version is on GitHub. */
export default function UpdateNotice() {
  const [update, setUpdate] = useState<{ tag: string; url: string } | null>(null);

  useEffect(() => {
    if (isDesktop()) void findUpdate(__APP_VERSION__).then(setUpdate);
  }, []);

  if (!update) return null;
  return (
    <div role="status" className="mx-auto mb-5 flex max-w-5xl flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-100 px-4 py-3 text-sm text-sky-800">
      <span className="flex-1">
        A new version ({update.tag.replace(/^desktop-/, '')}) is available. You have v{__APP_VERSION__}. Install it over this one; your data stays.
      </span>
      <button type="button" className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800" onClick={() => void openInBrowser(update.url)}>
        Download
      </button>
      <button
        type="button"
        className="rounded-lg px-3 py-1.5 hover:bg-sky-200"
        onClick={() => {
          dismissUpdate(update.tag);
          setUpdate(null);
        }}
      >
        Not now
      </button>
    </div>
  );
}
