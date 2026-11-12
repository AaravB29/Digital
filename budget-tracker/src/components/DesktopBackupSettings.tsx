import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { buildBackupNow, markBackedUp } from '../db/backupActions';
import { SETTINGS_ID } from '../db/types';
import { backupFolderPath, openBackupFolder, runAutoBackup } from '../desktop/files';
import { AUTO_BACKUP_KEEP } from '../lib/autoBackup';
import { secondaryButton } from './fieldStyles';

/** Desktop app: daily backups to Documents, with a switch and quick actions. */
export default function DesktopBackupSettings() {
  const settings = useLiveQuery(() => db.settings.get(SETTINGS_ID), []);
  const [folder, setFolder] = useState('Documents\\Budget Tracker Backups');
  const [status, setStatus] = useState<string | null>(null);
  const on = settings?.autoBackup !== false;

  useEffect(() => {
    void backupFolderPath().then(setFolder, () => undefined);
  }, []);

  async function backUpNow() {
    try {
      const { written } = await runAutoBackup(async () => JSON.stringify(await buildBackupNow(), null, 1), true);
      await markBackedUp();
      setStatus(`Saved ${written}`);
    } catch (e) {
      setStatus(`Could not save the backup: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">Daily backup</h3>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-teal-700"
          checked={on}
          onChange={(e) => void db.settings.update(SETTINGS_ID, { autoBackup: e.target.checked })}
        />
        <span>
          Save a backup every day to <span className="break-all font-medium">{folder}</span>. The newest {AUTO_BACKUP_KEEP} are kept.
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButton} onClick={() => void backUpNow()}>Back up now</button>
        <button type="button" className={secondaryButton} onClick={() => void openBackupFolder().catch(() => setStatus('That folder does not exist yet. Back up once first.'))}>
          Open backup folder
        </button>
      </div>
      <p role="status" className="min-h-5 text-sm text-slate-500">{status}</p>
    </div>
  );
}
