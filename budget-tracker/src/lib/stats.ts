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
