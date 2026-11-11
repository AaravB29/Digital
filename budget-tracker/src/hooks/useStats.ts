import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { ensureFixedExpenses } from '../db/fixedActions';
import type { Category, Expense, Income, MonthKey } from '../db/types';
import { currentMonthKey, monthsInRange, prevMonth } from '../lib/months';
import {
  averageMonthly,
  budgetVsActual,
  categoryMonthMatrix,
  foldMatrix,
  foldShares,
  foldSmallCategories,
  highestMonth,
  monthlySeries,
  savingsRate,
  shareOfTotal,
  topExpenses,
  totalsByCategory,
} from '../lib/stats';
import { OTHER_COLOR } from '../components/charts/chartTheme';

export interface TrendsData {
  months: MonthKey[];
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  loading: boolean;
}

/**
 * Live expenses and incomes for an inclusive month range. Fixed expenses are filled in
 * for months up to now, as if each month had been opened, so totals match the month view.
 */
export function useTrendsData(from: MonthKey, to: MonthKey): TrendsData {
  const months = from <= to ? monthsInRange(from, to) : [];
  const key = months.join(',');

  useEffect(() => {
    const now = currentMonthKey();
    for (const m of key ? key.split(',') : []) if (m <= now) void ensureFixedExpenses(m);
  }, [key]);

  const expenses = useLiveQuery(() => (months.length ? db.expenses.where('month').between(from, to, true, true).toArray() : []), [from, to]);
  const incomes = useLiveQuery(() => (months.length ? db.incomes.where('month').between(from, to, true, true).toArray() : []), [from, to]);
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), []);

  // A live query can briefly return the previous range's rows after the range changes.
  const inRange = (m: MonthKey) => m >= from && m <= to;
  return {
    months,
    expenses: (expenses ?? []).filter((e) => inRange(e.month)),
    incomes: (incomes ?? []).filter((i) => inRange(i.month)),
    categories: categories ?? [],
    loading: !expenses || !incomes || !categories,
  };
}

export const OTHER_KEY = '__other';
const STACK_KEEP = 6;
const DONUT_KEEP = 5;

/** Everything the Trends page shows, computed from the range's data with the tested helpers in lib/stats. */
export function useTrendsView(from: MonthKey, to: MonthKey) {
  const data = useTrendsData(from, to);
  const { months, expenses, incomes, categories } = data;
  const byId = new Map(categories.map((c) => [c.id, c]));
  const fixedIds = new Set(categories.filter((c) => c.isFixed).map((c) => c.id));

  const series = monthlySeries(months, expenses, incomes, fixedIds);
  const matrix = categoryMonthMatrix(months, expenses);
  const rangeTotals = totalsByCategory(expenses);

  const { kept, folded } = foldSmallCategories(rangeTotals, STACK_KEEP);
  const stack = foldMatrix(matrix, kept, folded, months.length);
  const stackSeries = stack.rows.map(({ categoryId, values }) => ({
    key: categoryId, label: byId.get(categoryId)?.name ?? categoryId, color: byId.get(categoryId)?.color ?? OTHER_COLOR, values,
  }));
  if (stack.other) stackSeries.push({ key: OTHER_KEY, label: `Other (${folded.length})`, color: OTHER_COLOR, values: stack.other });

  const endTotals = totalsByCategory(expenses.filter((e) => e.month === to));
  const donut = foldShares(endTotals, DONUT_KEEP);
  const donutSlices = donut.shares.map((s) => ({
    key: s.categoryId, label: byId.get(s.categoryId)?.name ?? s.categoryId, color: byId.get(s.categoryId)?.color ?? OTHER_COLOR, total: s.total, percent: s.percent,
  }));
  if (donut.other) donutSlices.push({ key: OTHER_KEY, label: `Other (${donut.other.count})`, color: OTHER_COLOR, ...donut.other });

  const spentTotal = series.reduce((s, p) => s + p.spent, 0);
  const incomeTotal = series.reduce((s, p) => s + p.income, 0);
  const ranked = shareOfTotal(rangeTotals);

  return {
    ...data,
    byId,
    series,
    matrix,
    stackSeries,
    donutSlices,
    endTotal: series[series.length - 1]?.spent ?? 0,
    tiles: {
      average: averageMonthly(series.filter((p) => p.spent > 0).map((p) => p.spent)),
      highest: highestMonth(series),
      biggest: ranked[0] ? { category: byId.get(ranked[0].categoryId), ...ranked[0] } : null,
      savings: savingsRate(incomeTotal, spentTotal),
    },
    momRows: categories.filter((c) => (rangeTotals.get(c.id) ?? 0) > 0).map((c) => ({ category: c, values: matrix.get(c.id) ?? months.map(() => 0) })),
    budgetRows: budgetVsActual(categories.filter((c) => !c.archived), endTotals),
    top: topExpenses(expenses.filter((e) => !fixedIds.has(e.categoryId)), 5),
    rankedCategoryIds: ranked.map((r) => r.categoryId),
  };
}

/** A month and the one before it, for the day-by-day comparison. */
export function useMonthPair(month: MonthKey) {
  const previous = prevMonth(month);
  useEffect(() => {
    const now = currentMonthKey();
    for (const m of [previous, month]) if (m <= now) void ensureFixedExpenses(m);
  }, [month, previous]);
  const rows = useLiveQuery(() => db.expenses.where('month').anyOf([previous, month]).toArray(), [month, previous]);
  return {
    previous,
    current: (rows ?? []).filter((e) => e.month === month),
    before: (rows ?? []).filter((e) => e.month === previous),
    loading: !rows,
  };
}
