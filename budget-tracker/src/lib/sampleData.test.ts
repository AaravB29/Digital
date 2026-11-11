import { describe, expect, it } from 'vitest';
import { generateSampleData, SAMPLE_PREFIX } from './sampleData';

const months = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

describe('generateSampleData', () => {
  const data = generateSampleData(months);

  it('is the same every time for the same seed', () => {
    expect(generateSampleData(months)).toEqual(data);
    expect(generateSampleData(months, 7)).not.toEqual(data);
  });

  it('uses whole cents, unique sample ids and dates inside their month', () => {
    const ids = new Set<string>();
    for (const e of data.expenses) {
      expect(Number.isInteger(e.amount) && e.amount > 0).toBe(true);
      expect(e.id.startsWith(SAMPLE_PREFIX)).toBe(true);
      expect(e.date.slice(0, 7)).toBe(e.month);
      ids.add(e.id);
    }
    expect(ids.size).toBe(data.expenses.length);
  });

  it('covers every month with income, rent and groceries', () => {
    for (const m of months) {
      expect(data.incomes.filter((i) => i.month === m)).toHaveLength(2);
      expect(data.expenses.some((e) => e.month === m && e.fixedKind === 'rent')).toBe(true);
      expect(data.expenses.filter((e) => e.month === m && e.categoryId === 'groceries').length).toBeGreaterThanOrEqual(6);
    }
  });

  it('cancels Netflix after the fourth month', () => {
    const netflixMonths = data.expenses.filter((e) => e.note === 'Netflix').map((e) => e.month);
    expect(netflixMonths).toEqual(months.slice(0, 4));
  });
});
