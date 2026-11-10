import { describe, expect, it } from 'vitest';
import { newId, sortExpensesByDate } from './expenses';

describe('sortExpensesByDate', () => {
  it('puts the newest date first, then the most recently created', () => {
    const rows = [
      { id: 'a', date: '2026-11-02', createdAt: '2026-11-02T10:00:00Z' },
      { id: 'b', date: '2026-11-09', createdAt: '2026-11-09T08:00:00Z' },
      { id: 'c', date: '2026-11-09', createdAt: '2026-11-09T12:00:00Z' },
      { id: 'd', date: '2026-11-05', createdAt: '2026-11-05T09:00:00Z' },
    ];
    expect(sortExpensesByDate(rows).map((r) => r.id)).toEqual(['c', 'b', 'd', 'a']);
    expect(rows[0].id).toBe('a'); // input untouched
  });
});

describe('newId', () => {
  it('returns unique strings', () => {
    const ids = new Set(Array.from({ length: 100 }, newId));
    expect(ids.size).toBe(100);
  });
});
