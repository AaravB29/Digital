import type { Category, Expense, FixedExpenseTemplate, Income, Settings } from '../db/types';
import { isMonthKey } from './months';

export const BACKUP_FORMAT = 'budget-tracker-backup';
export const BACKUP_VERSION = 1;
export const BACKUP_REMINDER_DAYS = 30;

export interface BackupData {
  categories: Category[];
  fixedTemplates: FixedExpenseTemplate[];
  expenses: Expense[];
  incomes: Income[];
  settings: Settings[];
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  data: BackupData;
}

export function createBackup(data: BackupData, now: Date = new Date()): BackupFile {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

export function backupFileName(now: Date = new Date()): string {
  return `budget-backup-${now.toISOString().slice(0, 10)}.json`;
}

type Check = (v: Record<string, unknown>) => boolean;
const str = (v: unknown) => typeof v === 'string' && v.length > 0;
const cents = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0;
const isoDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

const CHECKS: Record<keyof BackupData, Check> = {
  categories: (c) => str(c.id) && str(c.name) && typeof c.color === 'string' && typeof c.sortOrder === 'number',
  fixedTemplates: (t) =>
    str(t.id) && str(t.name) && cents(t.defaultAmount) && Number.isInteger(t.dayOfMonth) && isMonthKey(String(t.activeFrom)) &&
    (t.activeUntil === undefined || isMonthKey(String(t.activeUntil))),
  expenses: (e) => str(e.id) && isMonthKey(String(e.month)) && isoDate(e.date) && cents(e.amount) && str(e.categoryId),
  incomes: (i) => str(i.id) && isMonthKey(String(i.month)) && cents(i.amount) && typeof i.source === 'string',
  settings: (s) => str(s.id) && str(s.currency) && str(s.locale),
};

export type ParsedBackup =
  | { ok: true; backup: BackupFile; summary: { expenses: number; incomes: number; months: number; exportedAt: string } }
  | { ok: false; error: string };

/** Reads a backup file and checks every record before anything is replaced. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not a backup: it could not be read as JSON.' };
  }
  const file = raw as Partial<BackupFile> | null;
  if (!file || file.format !== BACKUP_FORMAT) return { ok: false, error: 'This file is not a Budget Tracker backup.' };
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of the app. Update the app first.' };
  }
  const data = file.data as Partial<BackupData> | undefined;
  for (const table of Object.keys(CHECKS) as Array<keyof BackupData>) {
    const rows: unknown = data?.[table];
    if (!Array.isArray(rows)) return { ok: false, error: `The backup is missing its ${table} list.` };
    const bad = (rows as unknown[]).findIndex((r) => !r || typeof r !== 'object' || !CHECKS[table](r as Record<string, unknown>));
    if (bad >= 0) return { ok: false, error: `Entry ${bad + 1} in ${table} is damaged, so nothing was restored.` };
  }
  const backup = file as BackupFile;
  return {
    ok: true,
    backup,
    summary: {
      expenses: backup.data.expenses.length,
      incomes: backup.data.incomes.length,
      months: new Set(backup.data.expenses.map((e) => e.month)).size,
      exportedAt: String(backup.exportedAt ?? ''),
    },
  };
}

/**
 * True when there is something worth saving and it has been 30+ days since the last backup
 * (or, if there has never been one, since the oldest entry the user typed in).
 */
export function needsBackupReminder(lastBackupAt: string | undefined, oldestEntryAt: string | undefined, now: Date = new Date()): boolean {
  const since = lastBackupAt ?? oldestEntryAt;
  if (!since) return false;
  const days = (now.getTime() - new Date(since).getTime()) / 86_400_000;
  return days >= BACKUP_REMINDER_DAYS;
}
