import type { Expense, Income } from '../db/types';

/** Sum of expense amounts, in cents. */
export function totalForMonth(expenses: Pick<Expense, 'amount'>[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/** Sum of income amounts, in cents. */
export function totalIncome(incomes: Pick<Income, 'amount'>[]): number {
  return incomes.reduce((sum, i) => sum + i.amount, 0);
}

export interface MonthSummary {
  income: number;
  spent: number;
  /** Income minus spent; negative when overspent. */
  remaining: number;
  /** Whole percent of income spent, or null when there is no income. */
  percentSpent: number | null;
}

export function monthSummary(
  expenses: Pick<Expense, 'amount'>[],
  incomes: Pick<Income, 'amount'>[],
): MonthSummary {
  const income = totalIncome(incomes);
  const spent = totalForMonth(expenses);
  return {
    income,
    spent,
    remaining: income - spent,
    percentSpent: income > 0 ? Math.round((spent * 100) / income) : null,
  };
}

/** Cents spent per category id. Categories without expenses are absent. */
export function totalsByCategory(expenses: Pick<Expense, 'amount' | 'categoryId'>[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of expenses) totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
  return totals;
}

export interface MonthPoint {
  month: string;
  spent: number;
  income: number;
  /** Spending in fixed categories (rent, insurance, subscriptions). */
  fixed: number;
  /** Everything else. */
  variable: number;
}

/** One point per month in `months`, including months with no data (all zero). */
export function monthlySeries(
  months: string[],
  expenses: Pick<Expense, 'month' | 'amount' | 'categoryId'>[],
  incomes: Pick<Income, 'month' | 'amount'>[],
  fixedCategoryIds: Set<string>,
): MonthPoint[] {
  const points = new Map(months.map((m) => [m, { month: m, spent: 0, income: 0, fixed: 0, variable: 0 }]));
  for (const e of expenses) {
    const p = points.get(e.month);
    if (!p) continue;
    p.spent += e.amount;
    if (fixedCategoryIds.has(e.categoryId)) p.fixed += e.amount;
    else p.variable += e.amount;
  }
  for (const i of incomes) {
    const p = points.get(i.month);
    if (p) p.income += i.amount;
  }
  return [...points.values()];
}

/** Cents per category per month: categoryId → values aligned with `months`. */
export function categoryMonthMatrix(
  months: string[],
  expenses: Pick<Expense, 'month' | 'amount' | 'categoryId'>[],
): Map<string, number[]> {
  const index = new Map(months.map((m, i) => [m, i]));
  const matrix = new Map<string, number[]>();
  for (const e of expenses) {
    const i = index.get(e.month);
    if (i === undefined) continue;
    let row = matrix.get(e.categoryId);
    if (!row) matrix.set(e.categoryId, (row = months.map(() => 0)));
    row[i] += e.amount;
  }
  return matrix;
}

/** Change from `previous` to `current`; percent is null when previous is 0. One decimal. */
export function monthOverMonthChange(current: number, previous: number): { diff: number; percent: number | null } {
  const diff = current - previous;
  return { diff, percent: previous === 0 ? null : Math.round((diff * 1000) / previous) / 10 };
}

/** Average in whole cents of the given monthly totals; 0 for an empty list. */
export function averageMonthly(values: number[]): number {
  return values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Share of income not spent, in percent with one decimal; null without income. Negative when overspent. */
export function savingsRate(income: number, spent: number): number | null {
  return income > 0 ? Math.round(((income - spent) * 1000) / income) / 10 : null;
}

export function highestMonth<T extends { spent: number }>(series: T[]): T | null {
  return series.reduce<T | null>((best, p) => (p.spent > 0 && (!best || p.spent > best.spent) ? p : best), null);
}

/** Categories ranked by total, largest first, with their share in percent (one decimal). */
export function shareOfTotal(totals: Map<string, number>): Array<{ categoryId: string; total: number; percent: number }> {
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([categoryId, total]) => ({ categoryId, total, percent: sum ? Math.round((total * 1000) / sum) / 10 : 0 }));
}

/** Keeps the `keep` largest categories; the rest are folded into one "Other" group. */
export function foldSmallCategories(totals: Map<string, number>, keep: number): { kept: string[]; folded: string[] } {
  const ranked = shareOfTotal(totals).map((s) => s.categoryId);
  if (ranked.length <= keep + 1) return { kept: ranked, folded: [] }; // folding a single category gains nothing
  return { kept: ranked.slice(0, keep), folded: ranked.slice(keep) };
}

export function topExpenses<T extends Pick<Expense, 'amount' | 'date'>>(expenses: T[], n: number): T[] {
  return [...expenses].sort((a, b) => b.amount - a.amount || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, n);
}

export interface BudgetRow {
  categoryId: string;
  budget: number;
  actual: number;
  /** Budget minus actual; negative when over. */
  remaining: number;
  percent: number;
}

/** Rows for categories that have a monthly budget, in the order given. */
export function budgetVsActual(
  categories: Array<{ id: string; monthlyBudget?: number }>,
  totals: Map<string, number>,
): BudgetRow[] {
  return categories
    .filter((c) => c.monthlyBudget && c.monthlyBudget > 0)
    .map((c) => {
      const budget = c.monthlyBudget!;
      const actual = totals.get(c.id) ?? 0;
      return { categoryId: c.id, budget, actual, remaining: budget - actual, percent: Math.round((actual * 100) / budget) };
    });
}

/** Rows for the kept categories plus one summed "Other" row (null when nothing is folded). */
export function foldMatrix(
  matrix: Map<string, number[]>,
  kept: string[],
  folded: string[],
  length: number,
): { rows: Array<{ categoryId: string; values: number[] }>; other: number[] | null } {
  const rows = kept.map((id) => ({ categoryId: id, values: matrix.get(id) ?? Array<number>(length).fill(0) }));
  if (folded.length === 0) return { rows, other: null };
  const other = Array<number>(length).fill(0);
  for (const id of folded) (matrix.get(id) ?? []).forEach((v, i) => (other[i] += v));
  return { rows, other };
}

/** The `keep` largest shares, plus a combined "Other" share when more than one category is left. */
export function foldShares(totals: Map<string, number>, keep: number) {
  const shares = shareOfTotal(totals);
  if (shares.length <= keep + 1) return { shares, other: null };
  const rest = shares.slice(keep);
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  const otherTotal = rest.reduce((a, s) => a + s.total, 0);
  return {
    shares: shares.slice(0, keep),
    other: { total: otherTotal, percent: Math.round((otherTotal * 1000) / sum) / 10, count: rest.length },
  };
}

/** Running total for each day of the month: index 0 is day 1. Dates outside the month are ignored. */
export function cumulativeByDay(expenses: Pick<Expense, 'date' | 'amount'>[], month: string, daysInMonth: number): number[] {
  const perDay = Array<number>(daysInMonth).fill(0);
  for (const e of expenses) {
    if (e.date.slice(0, 7) !== month) continue;
    const day = Number(e.date.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) perDay[day - 1] += e.amount;
  }
  let running = 0;
  return perDay.map((v) => (running += v));
}

export interface DayPoint {
  day: number;
  /** Null after the month's last day, or after today when it is the current month. */
  current: number | null;
  previous: number | null;
}

/**
 * Day-by-day running totals of a month next to the previous month, aligned by day number.
 * `lastDayShown` cuts the current line (e.g. today's date in the current month).
 */
export function dailyComparison(current: number[], previous: number[], lastDayShown: number = current.length): DayPoint[] {
  const days = Math.max(current.length, previous.length);
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    current: i < current.length && i < lastDayShown ? current[i] : null,
    previous: i < previous.length ? previous[i] : null,
  }));
}

/** What the month should cost if every budget is kept: fixed costs plus the budgets of other categories. */
export function plannedMonthTotal(
  fixedTotal: number,
  categories: Array<{ isFixed: boolean; archived: boolean; monthlyBudget?: number }>,
): number | null {
  const budgets = categories.filter((c) => !c.isFixed && !c.archived && c.monthlyBudget && c.monthlyBudget > 0);
  if (budgets.length === 0) return null;
  return fixedTotal + budgets.reduce((s, c) => s + c.monthlyBudget!, 0);
}
