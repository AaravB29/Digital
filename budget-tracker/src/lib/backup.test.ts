import { describe, expect, it } from 'vitest';
import { buildSeedData } from '../db/seed';
import { backupFileName, createBackup, needsBackupReminder, parseBackup, type BackupData } from './backup';

const seed = buildSeedData('2026-11');
const data: BackupData = {
  categories: seed.categories,
  fixedTemplates: seed.fixedTemplates,
  expenses: [
    { id: 'a', month: '2026-10', date: '2026-10-05', amount: 1250, categoryId: 'groceries', createdAt: '2026-10-05T10:00:00Z' },
    { id: 'b', month: '2026-11', date: '2026-11-01', amount: 65000, categoryId: 'fixed', templateId: 'rent', createdAt: '2026-11-01T10:00:00Z' },
  ],
  incomes: [{ id: 'i', month: '2026-11', amount: 90000, source: 'Job' }],
  settings: [seed.settings],
};

describe('backup round trip', () => {
  it('parses what it creates, with a summary', () => {
    const file = createBackup(data, new Date('2026-11-11T09:00:00Z'));
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.backup.data).toEqual(data);
      expect(parsed.summary).toEqual({ expenses: 2, incomes: 1, months: 2, exportedAt: '2026-11-11T09:00:00.000Z' });
    }
    expect(backupFileName(new Date('2026-11-11T09:00:00Z'))).toBe('budget-backup-2026-11-11.json');
  });
});

describe('parseBackup rejects bad files without touching data', () => {
  const file = () => JSON.parse(JSON.stringify(createBackup(data)));
  it.each([
    ['not JSON', 'hello', 'could not be read'],
    ['another app', JSON.stringify({ format: 'other' }), 'not a Budget Tracker backup'],
    ['a newer version', JSON.stringify({ ...file(), version: 99 }), 'newer version'],
    ['a missing table', JSON.stringify({ ...file(), data: { ...file().data, incomes: undefined } }), 'missing its incomes'],
  ])('%s', (_name, text, msg) => {
    const r = parseBackup(text);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(msg);
  });

  it('rejects float money and bad months', () => {
    const f = file();
    f.data.expenses[1].amount = 12.5;
    expect(parseBackup(JSON.stringify(f))).toEqual({ ok: false, error: 'Entry 2 in expenses is damaged, so nothing was restored.' });
    const g = file();
    g.data.expenses[0].month = '2026-13';
    expect(parseBackup(JSON.stringify(g)).ok).toBe(false);
  });
});

describe('needsBackupReminder', () => {
  const now = new Date('2026-11-11T12:00:00Z');
  it('stays quiet with no data or a recent backup', () => {
    expect(needsBackupReminder(undefined, undefined, now)).toBe(false);
    expect(needsBackupReminder('2026-11-01T12:00:00Z', '2026-01-01T00:00:00Z', now)).toBe(false);
  });
  it('reminds 30 days after the last backup', () => {
    expect(needsBackupReminder('2026-10-12T12:00:00Z', undefined, now)).toBe(true);
    expect(needsBackupReminder('2026-10-13T12:00:00Z', undefined, now)).toBe(false);
  });
  it('without any backup, counts from the oldest entry', () => {
    expect(needsBackupReminder(undefined, '2026-10-01T00:00:00Z', now)).toBe(true);
    expect(needsBackupReminder(undefined, '2026-11-05T00:00:00Z', now)).toBe(false);
  });
});
