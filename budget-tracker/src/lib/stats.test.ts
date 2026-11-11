import { describe, expect, it } from 'vitest';
import { monthSummary, totalForMonth, totalIncome, totalsByCategory } from './stats';

const amounts = (...cents: number[]) => cents.map((amount) => ({ amount }));

describe('totals', () => {
  it('adds cents exactly', () => {
    expect(totalForMonth(amounts(1250, 999, 1))).toBe(2250);
    expect(totalForMonth(amounts(10, 20))).toBe(30); // 0,10 € + 0,20 € = 0,30 € exactly
    expect(totalForMonth([])).toBe(0);
    expect(totalIncome(amounts(80000, 25000))).toBe(105000);
  });
});

describe('monthSummary', () => {
  it('computes income, spent, remaining and percent spent', () => {
    expect(monthSummary(amounts(30000, 12550), amounts(100000))).toEqual({
      income: 100000,
      spent: 42550,
      remaining: 57450,
      percentSpent: 43,
    });
  });

  it('goes negative when overspent', () => {
    const s = monthSummary(amounts(150000), amounts(100000));
    expect(s.remaining).toBe(-50000);
    expect(s.percentSpent).toBe(150);
  });

  it('has no percentage without income', () => {
    expect(monthSummary(amounts(500), [])).toEqual({
      income: 0, spent: 500, remaining: -500, percentSpent: null,
    });
  });
});

describe('totalsByCategory', () => {
  it('sums per category and adds up to the month total', () => {
    const rows = [
      { amount: 1250, categoryId: 'groceries' },
      { amount: 320, categoryId: 'transport' },
      { amount: 999, categoryId: 'groceries' },
      { amount: 65000, categoryId: 'fixed' },
    ];
    const totals = totalsByCategory(rows);
    expect(Object.fromEntries(totals)).toEqual({ groceries: 2249, transport: 320, fixed: 65000 });
    expect([...totals.values()].reduce((a, b) => a + b, 0)).toBe(totalForMonth(rows));
  });
});
