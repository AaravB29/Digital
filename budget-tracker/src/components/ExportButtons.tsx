import { useState } from 'react';
import { copyText, downloadText, DOWNLOADS_BLOCKED } from '../lib/download';
import { secondaryButton } from './fieldStyles';

interface Props {
  label: string;
  fileName: string;
  type: string;
  /** Builds the file contents when a button is pressed. */
  build: () => Promise<string>;
  /** Called after a successful download or copy. */
  onDone?: () => void;
}

/** "Download" plus a "Copy" fallback for places where downloads are blocked. */
export default function ExportButtons({ label, fileName, type, build, onDone }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  async function download() {
    downloadText(fileName, await build(), type);
    setStatus(`Saved ${fileName}`);
    onDone?.();
  }

  async function copy() {
    const ok = await copyText(await build());
    setStatus(ok ? 'Copied. Paste it into a note or file to keep it.' : 'Copying was blocked by the browser.');
    if (ok) onDone?.();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        {!DOWNLOADS_BLOCKED && <button type="button" className={secondaryButton} onClick={() => void download()}>{label}</button>}
        <button type="button" className={secondaryButton} onClick={() => void copy()}>
          {DOWNLOADS_BLOCKED ? `${label} (copy)` : 'Copy'}
        </button>
      </div>
      <p role="status" className="min-h-5 text-sm text-slate-500">{status}</p>
    </div>
  );
}
