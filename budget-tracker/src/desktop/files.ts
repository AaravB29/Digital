// Desktop-only helpers. Tauri modules are imported on demand so the website never loads them.
import { AUTO_BACKUP_FOLDER, autoBackupFileName, planAutoBackup } from '../lib/autoBackup';

/** Shows the Windows "Save as" dialog and writes the file. */
export async function saveWithDialog(fileName: string, text: string): Promise<'saved' | 'cancelled'> {
  const [{ save }, { writeTextFile }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-fs')]);
  const ext = fileName.split('.').pop() ?? 'txt';
  const path = await save({ defaultPath: fileName, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  if (!path) return 'cancelled';
  await writeTextFile(path, text);
  return 'saved';
}

/** Full path of Documents\Budget Tracker Backups, for showing to the user and opening. */
export async function backupFolderPath(): Promise<string> {
  const { documentDir, join } = await import('@tauri-apps/api/path');
  return join(await documentDir(), AUTO_BACKUP_FOLDER);
}

/**
 * Writes today's backup into Documents\Budget Tracker Backups (unless it exists, or `force`)
 * and deletes daily backups beyond the newest 30.
 */
export async function runAutoBackup(buildJson: () => Promise<string>, force = false): Promise<{ written: string | null; removed: number }> {
  const fs = await import('@tauri-apps/plugin-fs');
  const opts = { baseDir: fs.BaseDirectory.Document };
  if (!(await fs.exists(AUTO_BACKUP_FOLDER, opts))) await fs.mkdir(AUTO_BACKUP_FOLDER, { ...opts, recursive: true });
  const names = (await fs.readDir(AUTO_BACKUP_FOLDER, opts)).filter((e) => e.isFile).map((e) => e.name);
  const plan = planAutoBackup(names);
  const write = force ? autoBackupFileName() : plan.write;
  if (write) await fs.writeTextFile(`${AUTO_BACKUP_FOLDER}/${write}`, await buildJson(), opts);
  for (const name of plan.remove) await fs.remove(`${AUTO_BACKUP_FOLDER}/${name}`, opts);
  return { written: write, removed: plan.remove.length };
}

export async function openBackupFolder(): Promise<void> {
  const { openPath } = await import('@tauri-apps/plugin-opener');
  await openPath(await backupFolderPath());
}

/** Opens a web page in the user's normal browser instead of inside the app window. */
export async function openInBrowser(url: string): Promise<void> {
  const { openUrl } = await import('@tauri-apps/plugin-opener');
  await openUrl(url);
}
