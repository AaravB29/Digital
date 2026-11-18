// Android app (Capacitor). This file is only loaded inside the Android app.
import { AUTO_BACKUP_FOLDER, autoBackupFileName, planAutoBackup } from '../lib/autoBackup';
import type { NativeShell } from './types';

async function fs() {
  return import('@capacitor/filesystem');
}

/** Writes the file to the app's cache, then opens Android's share sheet so the user can save or send it. */
async function saveFile(fileName: string, text: string): Promise<'saved' | 'cancelled'> {
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([fs(), import('@capacitor/share')]);
  const { uri } = await Filesystem.writeFile({ path: fileName, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
  try {
    await Share.share({ title: fileName, files: [uri], dialogTitle: `Save or send ${fileName}` });
    return 'saved';
  } catch (e) {
    if (/cancel/i.test(e instanceof Error ? e.message : String(e))) return 'cancelled';
    throw e;
  }
}

/**
 * Daily backup in the phone's public Documents/Budget Tracker Backups folder, so it shows in the
 * Files app and survives uninstalling the app. Only files this app wrote are listed or removed.
 */
async function runAutoBackup(buildJson: () => Promise<string>, force = false) {
  const { Filesystem, Directory, Encoding } = await fs();
  const base = { directory: Directory.Documents };
  let names: string[] = [];
  try {
    names = (await Filesystem.readdir({ path: AUTO_BACKUP_FOLDER, ...base })).files.filter((f) => f.type === 'file').map((f) => f.name);
  } catch {
    await Filesystem.mkdir({ path: AUTO_BACKUP_FOLDER, recursive: true, ...base });
  }
  const plan = planAutoBackup(names);
  const write = force ? autoBackupFileName() : plan.write;
  if (write) {
    await Filesystem.writeFile({ path: `${AUTO_BACKUP_FOLDER}/${write}`, data: await buildJson(), encoding: Encoding.UTF8, recursive: true, ...base });
  }
  for (const name of plan.remove) {
    await Filesystem.deleteFile({ path: `${AUTO_BACKUP_FOLDER}/${name}`, ...base }).catch(() => undefined);
  }
  return { written: write, removed: plan.remove.length };
}

export const androidShell: NativeShell = {
  kind: 'android',
  releasePrefix: 'android-v',
  saveFile,
  runAutoBackup,
  backupFolderLabel: async () => `Documents › ${AUTO_BACKUP_FOLDER} (open it in the Files app)`,
  // Navigating to another site makes the Android app open it in the phone's browser and stay where it is.
  openInBrowser: async (url) => {
    window.location.href = url;
  },
};
