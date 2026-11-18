import { useEffect } from 'react';
import { db } from '../db/dexie';
import { buildBackupNow, markBackedUp } from '../db/backupActions';
import { SETTINGS_ID } from '../db/types';
import { getNativeShell } from './index';

const HOUR = 60 * 60 * 1000;

/** Windows and Android apps: one backup per day while auto-backup is on, checked at start and every hour after. */
export function useAutoBackup(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    async function tick() {
      const shell = await getNativeShell();
      if (!shell) return;
      const settings = await db.settings.get(SETTINGS_ID);
      if (settings?.autoBackup === false) return;
      // Skip an empty app, so a fresh install can never push older real backups out of the folder.
      if ((await db.expenses.count()) + (await db.incomes.count()) === 0) return;
      const { written } = await shell.runAutoBackup(async () => JSON.stringify(await buildBackupNow(), null, 1));
      if (written) await markBackedUp();
    }
    const run = () => void tick().catch((e: unknown) => console.error('Automatic backup failed', e));
    void getNativeShell().then((shell) => {
      if (!shell) return;
      run();
      timer = setInterval(run, HOUR);
    });
    return () => clearInterval(timer);
  }, []);
}
