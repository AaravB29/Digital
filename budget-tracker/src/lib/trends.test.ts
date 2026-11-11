import { describe, expect, it } from 'vitest';
import {
  averageMonthly,
  cumulativeByDay,
  dailyComparison,
  plannedMonthTotal,
  budgetVsActual,
  categoryMonthMatrix,
  foldMatrix,
  foldShares,
  foldSmallCategories,
  highestMonth,
  monthOverMonthChange,
  monthlySeries,
  savingsRate,
  shareOfTotal,
  topExpenses,
  totalForMonth,
} from './stats';

const months = ['2026-09', '2026-10', '2026-11'];
const expenses = [
  { month: '2026-09', amount: 65000, categoryId: 'fixed', date: '2026-09-01' },
  { month: '2026-09', amount: 4580, categoryId: 'groceries', date: '2026-09-04' },
  { month: '2026-10', amount: 65000, categoryId: 'fixed', date: '2026-10-01' },
  { month: '2026-10', amount: 9000, categoryId: 'groceries', date: '2026-10-12' },
  { month: '2026-10', amount: 2500, categoryId: 'eating-out', date: '2026-10-20' },
  { month: '2026-11', amount: 68000, categoryId: 'fixed', date: '2026-11-01' },
  { month: '2026-11', amount: 6000, categoryId: 'groceries', date: '2026-11-08' },
  { month: '2026-08', amount: 99999, categoryId: 'travel', date: '2026-08-02' }, // outside the range
];
const incomes = [
  { month: '2026-09', amount: 100000 },
  { month: '2026-10', amount: 100000 },
  { month: '2026-11', amount: 80000 },
  { month: '2026-11', amount: 20000 },
];

describe('monthlySeries', () => {
  const series = monthlySeries(months, expenses, incomes, new Set(['fixed']));

  it('gives one point per month with spent, income, fixed and variable', () => {
    expect(series).toEqual([
      { month: '2026-09', spent: 69580, income: 100000, fixed: 65000, variable: 4580 },
      { month: '2026-10', spent: 76500, income: 100000, fixed: 65000, variable: 11500 },
      { month: '2026-11', spent: 74000, income: 100000, fixed: 68000, variable: 6000 },
    ]);
  });

  it('matches the month view totals', () => {
    for (const p of series) {
      expect(p.spent).toBe(totalForMonth(expenses.filter((e) => e.month === p.month)));
      expect(p.fixed + p.variable).toBe(p.spent);
    }
  });

  it('includes empty months as zero', () => {
    expect(monthlySeries(['2026-12'], expenses, incomes, new Set())).toEqual([
      { month: '2026-12', spent: 0, income: 0, fixed: 0, variable: 0 },
    ]);
  });
});

describe('categoryMonthMatrix', () => {
  it('aligns category totals with the months', () => {
    const m = categoryMonthMatrix(months, expenses);
    expect(m.get('groceries')).toEqual([4580, 9000, 6000]);
    expect(m.get('eating-out')).toEqual([0, 2500, 0]);
    expect(m.has('travel')).toBe(false);
  });
});

describe('monthOverMonthChange', () => {
  it('gives the difference and percent', () => {
    expect(monthOverMonthChange(6000, 9000)).toEqual({ diff: -3000, percent: -33.3 });
    expect(monthOverMonthChange(9000, 4580)).toEqual({ diff: 4420, percent: 96.5 });
    expect(monthOverMonthChange(5000, 5000)).toEqual({ diff: 0, percent: 0 });
  });
  it('has no percent when the previous month was zero', () => {
    expect(monthOverMonthChange(2500, 0)).toEqual({ diff: 2500, percent: null });
  });
});

describe('averages, highs and savings', () => {
  it('averages whole cents', () => {
    expect(averageMonthly([69580, 76500, 74000])).toBe(73360);
    expect(averageMonthly([100, 101])).toBe(101); // 100.5 rounds up
    expect(averageMonthly([])).toBe(0);
  });
  it('finds the highest month and ignores empty ones', () => {
    expect(highestMonth([{ month: 'a', spent: 5 }, { month: 'b', spent: 9 }, { month: 'c', spent: 9 }])).toEqual({ month: 'b', spent: 9 });
    expect(highestMonth([{ month: 'a', spent: 0 }])).toBeNull();
  });
  it('computes the savings rate', () => {
    expect(savingsRate(100000, 74000)).toBe(26);
    expect(savingsRate(300000, 220080)).toBe(26.6);
    expect(savingsRate(100000, 150000)).toBe(-50);
    expect(savingsRate(0, 5000)).toBeNull();
  });
});

describe('shares and folding', () => {
  const totals = new Map([['a', 5000], ['b', 3000], ['c', 1500], ['d', 500], ['e', 0]]);
  it('ranks categories by share', () => {
    expect(shareOfTotal(totals)).toEqual([
      { categoryId: 'a', total: 5000, percent: 50 },
      { categoryId: 'b', total: 3000, percent: 30 },
      { categoryId: 'c', total: 1500, percent: 15 },
      { categoryId: 'd', total: 500, percent: 5 },
    ]);
  });
  it('folds the smallest into Other', () => {
    expect(foldSmallCategories(totals, 2)).toEqual({ kept: ['a', 'b'], folded: ['c', 'd'] });
    expect(foldSmallCategories(totals, 3)).toEqual({ kept: ['a', 'b', 'c', 'd'], folded: [] });
  });
});

describe('topExpenses', () => {
  it('returns the largest first', () => {
    expect(topExpenses(expenses, 3).map((e) => e.amount)).toEqual([99999, 68000, 65000]);
  });
});

describe('budgetVsActual', () => {
  it('only lists categories with a budget', () => {
    const rows = budgetVsActual(
      [{ id: 'groceries', monthlyBudget: 10000 }, { id: 'eating-out', monthlyBudget: 2000 }, { id: 'fixed' }],
      new Map([['groceries', 6000], ['eating-out', 2500]]),
    );
    expect(rows).toEqual([
      { categoryId: 'groceries', budget: 10000, actual: 6000, remaining: 4000, percent: 60 },
      { categoryId: 'eating-out', budget: 2000, actual: 2500, remaining: -500, percent: 125 },
    ]);
  });
});

describe('folding into Other', () => {
  it('sums folded categories month by month', () => {
    const matrix = new Map([['a', [1, 2]], ['b', [10, 0]], ['c', [5, 5]]]);
    expect(foldMatrix(matrix, ['a'], ['b', 'c'], 2)).toEqual({ rows: [{ categoryId: 'a', values: [1, 2] }], other: [15, 5] });
    expect(foldMatrix(matrix, ['a', 'b'], [], 2).other).toBeNull();
  });

  it('combines the smallest shares and keeps the total intact', () => {
    const totals = new Map([['a', 6000], ['b', 2000], ['c', 1000], ['d', 1000]]);
    const { shares, other } = foldShares(totals, 2);
    expect(shares.map((s) => s.categoryId)).toEqual(['a', 'b']);
    expect(other).toEqual({ total: 2000, percent: 20, count: 2 });
    expect(shares.reduce((s, x) => s + x.total, 0) + other!.total).toBe(10000);
    expect(foldShares(totals, 3).other).toBeNull();
  });
});

describe('day-by-day month trend', () => {
  const nov = [
    { date: '2026-11-01', amount: 65000 },
    { date: '2026-11-03', amount: 1250 },
    { date: '2026-11-03', amount: 320 },
    { date: '2026-11-30', amount: 1000 },
    { date: '2026-12-01', amount: 9999 }, // other month, ignored
  ];

  it('builds running totals per day', () => {
    const c = cumulativeByDay(nov, '2026-11', 30);
    expect(c).toHaveLength(30);
    expect(c.slice(0, 4)).toEqual([65000, 65000, 66570, 66570]);
    expect(c[29]).toBe(67570);
    expect(c[29]).toBe(totalForMonth(nov.slice(0, 4)));
  });

  it('aligns a short month with a long one and cuts the current line at today', () => {
    const feb = [1, 2, 3]; // 3-day toy month
    const jan = [10, 20, 30, 40, 50];
    expect(dailyComparison(feb, jan)).toEqual([
      { day: 1, current: 1, previous: 10 },
      { day: 2, current: 2, previous: 20 },
      { day: 3, current: 3, previous: 30 },
      { day: 4, current: null, previous: 40 },
      { day: 5, current: null, previous: 50 },
    ]);
    expect(dailyComparison(jan, feb, 2).map((p) => p.current)).toEqual([10, 20, null, null, null]);
  });

  it('plans the month as fixed costs plus category budgets', () => {
    const cats = [
      { isFixed: true, archived: false, monthlyBudget: 99999 }, // the Fixed category's own budget is not added twice
      { isFixed: false, archived: false, monthlyBudget: 25000 },
      { isFixed: false, archived: true, monthlyBudget: 5000 },
      { isFixed: false, archived: false },
    ];
    expect(plannedMonthTotal(78550, cats)).toBe(103550);
    expect(plannedMonthTotal(78550, [{ isFixed: false, archived: false }])).toBeNull();
  });
});
