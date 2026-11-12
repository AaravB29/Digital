import { useEffect } from 'react';
import { db } from '../db/dexie';
import { buildBackupNow, markBackedUp } from '../db/backupActions';
import { SETTINGS_ID } from '../db/types';
import { isDesktop } from './platform';
import { runAutoBackup } from './files';

const HOUR = 60 * 60 * 1000;

/** Desktop app: one backup per day while auto-backup is on, checked at start and every hour after. */
export function useAutoBackup(): void {
  useEffect(() => {
    if (!isDesktop()) return;
    async function tick() {
      const settings = await db.settings.get(SETTINGS_ID);
      if (settings?.autoBackup === false) return;
      // Skip an empty app, so a fresh install can never push older real backups out of the folder.
      if ((await db.expenses.count()) + (await db.incomes.count()) === 0) return;
      const { written } = await runAutoBackup(async () => JSON.stringify(await buildBackupNow(), null, 1));
      if (written) await markBackedUp();
    }
    const run = () => void tick().catch((e: unknown) => console.error('Automatic backup failed', e));
    run();
    const timer = setInterval(run, HOUR);
    return () => clearInterval(timer);
  }, []);
}
