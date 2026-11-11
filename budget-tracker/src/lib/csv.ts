import type { Category, Expense, FixedExpenseTemplate } from '../db/types';

/** Exact decimal text for cents, e.g. 1250 → "12.50", 5 → "0.05". No floats involved. */
export function centsToDecimal(cents: number): string {
  if (!Number.isInteger(cents)) throw new Error(`Money must be integer cents, got ${cents}`);
  const abs = Math.abs(cents);
  return `${cents < 0 ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Quotes a field when needed. Text starting with = + - @ is prefixed with ' so spreadsheet
 * apps do not run it as a formula.
 */
export function csvField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: Array<Array<string | number | undefined | null>>): string {
  return rows.map((r) => r.map(csvField).join(',')).join('\r\n') + '\r\n';
}

export const EXPENSE_CSV_HEADER = ['Date', 'Month', 'Category', 'Note', 'Amount', 'Currency', 'Type', 'Paid'];

/** One row per expense, oldest first. Amounts are plain decimals with a dot, which every spreadsheet reads. */
export function expensesToCsv(
  expenses: Expense[],
  categories: Category[],
  templates: FixedExpenseTemplate[],
  currency: string,
): string {
  const cats = new Map(categories.map((c) => [c.id, c]));
  const tpls = new Map(templates.map((t) => [t.id, t.name]));
  const sorted = [...expenses].sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.createdAt < b.createdAt ? -1 : 1));
  return toCsv([
    EXPENSE_CSV_HEADER,
    ...sorted.map((e) => [
      e.date,
      e.month,
      cats.get(e.categoryId)?.name ?? e.categoryId,
      (e.templateId && tpls.get(e.templateId)) || e.note || '',
      centsToDecimal(e.amount),
      currency,
      e.templateId || cats.get(e.categoryId)?.isFixed ? 'Fixed' : 'Variable',
      e.templateId ? (e.isPaid ? 'yes' : 'no') : '',
    ]),
  ]);
}
