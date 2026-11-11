import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { oldestEntryAt } from '../db/backupActions';
import { SETTINGS_ID } from '../db/types';
import { needsBackupReminder } from '../lib/backup';

/** Shown on the month page when the last backup is 30+ days old. "Later" hides it until the app is reopened. */
export default function BackupReminder() {
  const settings = useLiveQuery(() => db.settings.get(SETTINGS_ID), []);
  const [oldest, setOldest] = useState<string | undefined>();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    void oldestEntryAt().then(setOldest);
  }, []);

  if (hidden || !settings || !needsBackupReminder(settings.lastBackupAt, oldest)) return null;
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <span className="flex-1">
        {settings.lastBackupAt ? 'It’s been over 30 days since your last backup.' : 'You haven’t made a backup yet.'} Your data lives only on this device.
      </span>
      <Link to="/settings#backup" className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800">Back up now</Link>
      <button type="button" className="rounded-lg px-3 py-1.5 hover:bg-amber-100" onClick={() => setHidden(true)}>Later</button>
    </div>
  );
}
