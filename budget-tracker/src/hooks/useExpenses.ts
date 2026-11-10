import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import type { Category, Expense, Income, MonthKey } from '../db/types';
import { SETTINGS_ID } from '../db/types';
import { sortExpensesByDate } from '../lib/expenses';
import { DEFAULT_MONEY_FORMAT, type MoneyFormat } from '../lib/money';

export interface MonthData {
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  loading: boolean;
}

/** Live expenses, incomes and categories for a month; re-renders whenever the database changes. */
export function useMonthData(month: MonthKey): MonthData {
  const expenses = useLiveQuery(
    () => db.expenses.where('month').equals(month).toArray().then(sortExpensesByDate),
    [month],
  );
  const incomes = useLiveQuery(() => db.incomes.where('month').equals(month).toArray(), [month]);
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), []);
  return {
    expenses: expenses ?? [],
    incomes: incomes ?? [],
    categories: categories ?? [],
    loading: expenses === undefined || incomes === undefined || categories === undefined,
  };
}

/** Currency and locale from settings. */
export function useMoneyFormat(): MoneyFormat {
  const settings = useLiveQuery(() => db.settings.get(SETTINGS_ID), []);
  return settings ? { currency: settings.currency, locale: settings.locale } : DEFAULT_MONEY_FORMAT;
}
