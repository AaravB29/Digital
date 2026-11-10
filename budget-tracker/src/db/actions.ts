import { db } from './dexie';
import type { Expense, Income } from './types';
import { newId } from '../lib/expenses';
import { monthOfIsoDate } from '../lib/months';

export interface ExpenseInput {
  date: string;
  amount: number;
  categoryId: string;
  note?: string;
}

export async function addExpense(input: ExpenseInput): Promise<Expense> {
  const expense: Expense = {
    id: newId(),
    month: monthOfIsoDate(input.date),
    date: input.date,
    amount: input.amount,
    categoryId: input.categoryId,
    note: input.note || undefined,
    createdAt: new Date().toISOString(),
  };
  await db.expenses.add(expense);
  return expense;
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  await db.expenses.update(id, {
    month: monthOfIsoDate(input.date),
    date: input.date,
    amount: input.amount,
    categoryId: input.categoryId,
    note: input.note || undefined,
  });
}

/** Deletes and returns the row so it can be restored by an undo. */
export async function deleteExpense(expense: Expense): Promise<Expense> {
  await db.expenses.delete(expense.id);
  return expense;
}

export async function restoreExpense(expense: Expense): Promise<void> {
  await db.expenses.put(expense);
}

export async function addIncome(month: string, source: string, amount: number): Promise<Income> {
  const income: Income = { id: newId(), month, source, amount };
  await db.incomes.add(income);
  return income;
}

export async function deleteIncome(income: Income): Promise<Income> {
  await db.incomes.delete(income.id);
  return income;
}

export async function restoreIncome(income: Income): Promise<void> {
  await db.incomes.put(income);
}
