import type { Expense, FixedExpenseTemplate, MonthKey } from '../db/types';
import { parseMoney } from './money';

/** True if the template applies in `month` (activeFrom and activeUntil are inclusive). */
export function isTemplateActive(t: Pick<FixedExpenseTemplate, 'activeFrom' | 'activeUntil'>, month: MonthKey): boolean {
  return t.activeFrom <= month && (!t.activeUntil || month <= t.activeUntil);
}

export function activeTemplatesForMonth<T extends FixedExpenseTemplate>(templates: T[], month: MonthKey): T[] {
  return templates.filter((t) => isTemplateActive(t, month));
}

/** Stable id, so the same template can never produce two rows in one month. */
export function fixedExpenseId(templateId: string, month: MonthKey): string {
  return `fixed:${templateId}:${month}`;
}

/** ISO due date of a template in a month; day is clamped to 1–28. */
export function fixedDueDate(t: Pick<FixedExpenseTemplate, 'dayOfMonth'>, month: MonthKey): string {
  const day = Math.min(28, Math.max(1, Math.trunc(t.dayOfMonth) || 1));
  return `${month}-${String(day).padStart(2, '0')}`;
}

/** Rows to create so every active template has exactly one row in `month`. */
export function missingFixedExpenses(
  templates: FixedExpenseTemplate[],
  monthExpenses: Pick<Expense, 'id' | 'templateId'>[],
  month: MonthKey,
  fixedCategoryId: string,
  createdAt: string,
): Expense[] {
  const existingTemplateIds = new Set(monthExpenses.map((e) => e.templateId).filter(Boolean));
  const existingIds = new Set(monthExpenses.map((e) => e.id));
  return activeTemplatesForMonth(templates, month)
    .filter((t) => !existingTemplateIds.has(t.id) && !existingIds.has(fixedExpenseId(t.id, month)))
    .map((t) => ({
      id: fixedExpenseId(t.id, month),
      month,
      date: fixedDueDate(t, month),
      amount: t.defaultAmount,
      categoryId: fixedCategoryId,
      note: t.name,
      templateId: t.id,
      isOverridden: false,
      isPaid: false,
      createdAt,
    }));
}

/** New amount for one month's row; it counts as edited only if it differs from the default. */
export function applyFixedAmountEdit(newAmount: number, template?: Pick<FixedExpenseTemplate, 'defaultAmount'>) {
  return { amount: newAmount, isOverridden: template ? newAmount !== template.defaultAmount : true };
}

export type DefaultChangeScope = 'this_month_onward' | 'future_only';

/** Generated, un-edited rows of a template that a new default amount should update. */
export function rowsToRetarget(
  rows: Expense[],
  templateId: string,
  scope: DefaultChangeScope,
  currentMonth: MonthKey,
): Expense[] {
  return rows.filter(
    (r) =>
      r.templateId === templateId &&
      !r.isOverridden &&
      (scope === 'this_month_onward' ? r.month >= currentMonth : r.month > currentMonth),
  );
}

/**
 * Generated rows that should disappear after a template changes (rows now outside its
 * active months) or is removed (rows from this month on). Rows the user marked paid or
 * edited are kept, since they are the user's own record.
 */
export function staleGeneratedRows(
  template: FixedExpenseTemplate | null,
  templateId: string,
  rows: Expense[],
  currentMonth: MonthKey,
): Expense[] {
  return rows.filter((r) => {
    if (r.templateId !== templateId || r.isPaid || r.isOverridden) return false;
    return template ? !isTemplateActive(template, r.month) : r.month >= currentMonth;
  });
}

export interface FixedSummary {
  total: number;
  paid: number;
  due: number;
  count: number;
  paidCount: number;
}

export function fixedSummary(rows: Pick<Expense, 'amount' | 'isPaid'>[]): FixedSummary {
  const paidRows = rows.filter((r) => r.isPaid);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const paid = paidRows.reduce((s, r) => s + r.amount, 0);
  return { total, paid, due: total - paid, count: rows.length, paidCount: paidRows.length };
}

export interface TemplateDraft {
  name: string;
  amountText: string;
  dayOfMonth: number;
  activeFrom: MonthKey;
  activeUntil?: MonthKey;
}

/** Returns the parsed amount in cents, or an error message for the form. */
export function validateTemplate(d: TemplateDraft): { amount: number } | { error: string } {
  if (!d.name.trim()) return { error: 'Give it a name, like "Rent".' };
  const amount = d.amountText.trim() === '' ? 0 : parseMoney(d.amountText);
  if (amount === null) return { error: 'Enter the amount as a number, like 650,00.' };
  if (!Number.isInteger(d.dayOfMonth) || d.dayOfMonth < 1 || d.dayOfMonth > 28) {
    return { error: 'Due day must be between 1 and 28.' };
  }
  if (d.activeUntil && d.activeUntil < d.activeFrom) return { error: 'The end month must not be before the start month.' };
  return { amount };
}

/** Splits a month's rows into generated fixed rows (by due date, then name) and everything else. */
export function splitFixedRows<T extends Pick<Expense, 'templateId' | 'date' | 'note'>>(rows: T[]): { fixed: T[]; variable: T[] } {
  const fixed = rows
    .filter((r) => r.templateId)
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : (a.note ?? '').localeCompare(b.note ?? '')));
  return { fixed, variable: rows.filter((r) => !r.templateId) };
}

/** 1 → "1st", 2 → "2nd", 11 → "11th", 22 → "22nd". */
export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}
