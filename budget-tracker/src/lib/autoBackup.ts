import { format } from 'date-fns';

export const AUTO_BACKUP_FOLDER = 'Budget Tracker Backups';
export const AUTO_BACKUP_KEEP = 30;

const NAME = /^budget-backup-(\d{4}-\d{2}-\d{2})\.json$/;

/** Name of the daily backup file, by the local date: "budget-backup-2026-11-12.json". */
export function autoBackupFileName(now: Date = new Date()): string {
  return `budget-backup-${format(now, 'yyyy-MM-dd')}.json`;
}

/**
 * What the daily backup should do, given the files already in the backup folder:
 * write today's file unless it exists, then keep only the newest `keep` backups.
 * Files that are not daily backups (anything the user put there) are never removed.
 */
export function planAutoBackup(
  existing: string[],
  now: Date = new Date(),
  keep: number = AUTO_BACKUP_KEEP,
): { write: string | null; remove: string[] } {
  const today = autoBackupFileName(now);
  const backups = new Set(existing.filter((n) => NAME.test(n)));
  const write = backups.has(today) ? null : today;
  if (write) backups.add(write);
  const newestFirst = [...backups].sort().reverse();
  return { write, remove: newestFirst.slice(keep).filter((n) => n !== write) };
}
