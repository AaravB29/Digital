import { describe, expect, it } from 'vitest';
import { autoBackupFileName, planAutoBackup } from './autoBackup';

const day = (d: string) => `budget-backup-${d}.json`;
const now = new Date(2026, 10, 12, 9, 30);

describe('autoBackupFileName', () => {
  it('uses the local date', () => {
    expect(autoBackupFileName(now)).toBe('budget-backup-2026-11-12.json');
    expect(autoBackupFileName(new Date(2026, 0, 3, 23, 59))).toBe('budget-backup-2026-01-03.json');
  });
});

describe('planAutoBackup', () => {
  it('writes today’s backup into an empty folder', () => {
    expect(planAutoBackup([], now)).toEqual({ write: day('2026-11-12'), remove: [] });
  });

  it('does nothing when today’s backup already exists', () => {
    expect(planAutoBackup([day('2026-11-12'), day('2026-11-11')], now)).toEqual({ write: null, remove: [] });
  });

  it('keeps only the newest backups, counting today’s', () => {
    const existing = ['2026-11-09', '2026-11-10', '2026-11-11'].map(day);
    expect(planAutoBackup(existing, now, 3)).toEqual({ write: day('2026-11-12'), remove: [day('2026-11-09')] });
  });

  it('removes old files even when today’s already exists, sorting by date not by listing order', () => {
    const existing = [day('2026-11-12'), day('2026-10-01'), day('2026-11-11'), day('2026-09-15')];
    expect(planAutoBackup(existing, now, 2).remove.sort()).toEqual([day('2026-09-15'), day('2026-10-01')]);
  });

  it('never touches files that are not daily backups', () => {
    const existing = ['notes.txt', 'budget-backup-old copy.json', 'my-budget.json', ...['2026-11-10', '2026-11-11'].map(day)];
    expect(planAutoBackup(existing, now, 1)).toEqual({ write: day('2026-11-12'), remove: [day('2026-11-11'), day('2026-11-10')] });
  });
});
