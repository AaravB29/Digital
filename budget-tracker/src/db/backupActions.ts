import { db } from './dexie';
import { SETTINGS_ID } from './types';
import { createBackup, type BackupData, type BackupFile } from '../lib/backup';

export async function readAllData(): Promise<BackupData> {
  const [categories, fixedTemplates, expenses, incomes, settings] = await Promise.all([
    db.categories.toArray(), db.fixedTemplates.toArray(), db.expenses.toArray(), db.incomes.toArray(), db.settings.toArray(),
  ]);
  return { categories, fixedTemplates, expenses, incomes, settings };
}

export async function buildBackupNow(): Promise<BackupFile> {
  return createBackup(await readAllData());
}

export async function markBackedUp(): Promise<void> {
  await db.settings.update(SETTINGS_ID, { lastBackupAt: new Date().toISOString() });
}

/**
 * Replaces everything on this device with the backup, in one transaction (all or nothing).
 * Resolves only after a fresh read sees the restored rows, so "Restored" is never shown early.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  const { data } = backup;
  await db.transaction('rw', [db.categories, db.fixedTemplates, db.expenses, db.incomes, db.settings], async () => {
    for (const table of [db.categories, db.fixedTemplates, db.expenses, db.incomes, db.settings]) await table.clear();
    await db.categories.bulkAdd(data.categories);
    await db.fixedTemplates.bulkAdd(data.fixedTemplates);
    await db.expenses.bulkAdd(data.expenses);
    await db.incomes.bulkAdd(data.incomes);
    await db.settings.bulkAdd(data.settings.map((s) => ({ ...s, lastBackupAt: new Date().toISOString() })));
  });
  // A read transaction on these stores can only run after the write above has committed.
  const [expenses, incomes] = await db.transaction('r', db.expenses, db.incomes, () =>
    Promise.all([db.expenses.count(), db.incomes.count()]),
  );
  if (expenses !== data.expenses.length || incomes !== data.incomes.length) {
    throw new Error('The restore did not complete. Your data was not changed; please try again.');
  }
}

/** When the oldest expense the user typed in was created (generated fixed rows don't count). */
export async function oldestEntryAt(): Promise<string | undefined> {
  let oldest: string | undefined;
  await db.expenses.each((e) => {
    if (!e.templateId && (!oldest || e.createdAt < oldest)) oldest = e.createdAt;
  });
  return oldest;
}
