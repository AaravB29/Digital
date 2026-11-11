import type { Category, Expense } from '../db/types';
import { parseMoney } from './money';

export type BudgetLevel = 'ok' | 'warn' | 'over';

/** Green below 80 %, amber from 80 % to 100 %, red above 100 %. */
export function budgetStatus(spent: number, budget: number | undefined): { percent: number; level: BudgetLevel } | null {
  if (!budget || budget <= 0) return null;
  const percent = Math.round((spent * 100) / budget);
  const level: BudgetLevel = spent > budget ? 'over' : spent * 100 >= budget * 80 ? 'warn' : 'ok';
  return { percent, level };
}

/**
 * Categories shown as tabs, in sort order: every active one, plus archived ones that
 * still have spending this month, so the tab subtotals always add up to the month total.
 */
export function tabCategories(categories: Category[], totals: Map<string, number>): Category[] {
  return [...categories]
    .filter((c) => !c.archived || (totals.get(c.id) ?? 0) > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Categories offered when adding or editing an expense: active ones, plus its current one. */
export function selectableCategories(categories: Category[], currentId?: string): Category[] {
  return categories.filter((c) => !c.archived || c.id === currentId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export type ExpenseSort = 'date' | 'amount';

/** Case-insensitive search across note and category name, then sorted (newest or largest first). */
export function filterAndSortExpenses<T extends Pick<Expense, 'note' | 'categoryId' | 'amount' | 'date' | 'createdAt'>>(
  expenses: T[],
  query: string,
  sort: ExpenseSort,
  categoryNames: Map<string, string>,
): T[] {
  const q = query.trim().toLowerCase();
  const matches = q
    ? expenses.filter((e) => `${e.note ?? ''} ${categoryNames.get(e.categoryId) ?? ''}`.toLowerCase().includes(q))
    : [...expenses];
  return matches.sort((a, b) => {
    if (sort === 'amount' && a.amount !== b.amount) return b.amount - a.amount;
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
  });
}

/**
 * Moves a category one step up or down and returns the new sortOrder for every
 * category (0, 1, 2, …). Returns null when it is already at that end.
 */
export function moveCategory(categories: Category[], id: string, direction: -1 | 1): Array<{ id: string; sortOrder: number }> | null {
  const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const from = ordered.findIndex((c) => c.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ordered.length) return null;
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
  return ordered.map((c, i) => ({ id: c.id, sortOrder: i }));
}

export interface CategoryDraft {
  name: string;
  budgetText: string;
}

/** Validates a category form; budget is optional (empty = no budget). */
export function validateCategory(
  draft: CategoryDraft,
  others: Pick<Category, 'name'>[],
): { name: string; monthlyBudget: number | undefined } | { error: string } {
  const name = draft.name.trim();
  if (!name) return { error: 'Give the category a name.' };
  if (others.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) {
    return { error: `There is already a category called "${name}".` };
  }
  if (draft.budgetText.trim() === '') return { name, monthlyBudget: undefined };
  const budget = parseMoney(draft.budgetText);
  if (budget === null) return { error: 'Enter the budget as a number, like 250,00, or leave it empty.' };
  return { name, monthlyBudget: budget > 0 ? budget : undefined };
}

/** Lowercase slug for a new category id, made unique against existing ids. */
export function categoryId(name: string, existingIds: string[]): string {
  const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
  let id = base;
  for (let n = 2; existingIds.includes(id); n++) id = `${base}-${n}`;
  return id;
}
