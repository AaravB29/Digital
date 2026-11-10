import { db } from './dexie';
import { FIXED_CATEGORY_ID } from './seed';
import type { Expense, FixedExpenseTemplate, MonthKey } from './types';
import {
  applyFixedAmountEdit,
  missingFixedExpenses,
  rowsToRetarget,
  staleGeneratedRows,
  type DefaultChangeScope,
} from '../lib/fixed';
import { currentMonthKey } from '../lib/months';
import { newId } from '../lib/expenses';

/** Creates this month's missing fixed rows. Safe to call repeatedly; never duplicates. */
export function ensureFixedExpenses(month: MonthKey): Promise<void> {
  return db.transaction('rw', db.fixedTemplates, db.expenses, async () => {
    const templates = await db.fixedTemplates.toArray();
    const existing = await db.expenses.where('month').equals(month).toArray();
    const missing = missingFixedExpenses(templates, existing, month, FIXED_CATEGORY_ID, new Date().toISOString());
    if (missing.length > 0) await db.expenses.bulkAdd(missing);
  });
}

export async function setFixedPaid(id: string, isPaid: boolean): Promise<void> {
  await db.expenses.update(id, { isPaid });
}

/** Changes one month's amount only. */
export async function editFixedAmount(row: Expense, amount: number): Promise<void> {
  const template = row.templateId ? await db.fixedTemplates.get(row.templateId) : undefined;
  await db.expenses.update(row.id, applyFixedAmountEdit(amount, template));
}

export async function resetFixedAmount(row: Expense): Promise<void> {
  const template = row.templateId ? await db.fixedTemplates.get(row.templateId) : undefined;
  if (template) await db.expenses.update(row.id, { amount: template.defaultAmount, isOverridden: false });
}

export type TemplateInput = Omit<FixedExpenseTemplate, 'id'>;

/**
 * Adds or updates a template. A new default amount is copied into generated, un-edited
 * rows from this month on, or only into later months; past months never change.
 */
export async function saveTemplate(
  id: string | null,
  input: TemplateInput,
  scope: DefaultChangeScope = 'this_month_onward',
): Promise<string> {
  const current = currentMonthKey();
  const templateId = id ?? newId();
  if (scope === 'future_only') await ensureFixedExpenses(current); // pin this month to the old amount

  await db.transaction('rw', db.fixedTemplates, db.expenses, async () => {
    const before = id ? await db.fixedTemplates.get(id) : undefined;
    const template: FixedExpenseTemplate = { ...input, id: templateId };
    await db.fixedTemplates.put(template);

    const rows = await db.expenses.where('categoryId').equals(FIXED_CATEGORY_ID).toArray();
    if (before) {
      if (before.defaultAmount !== template.defaultAmount) {
        for (const r of rowsToRetarget(rows, templateId, scope, current)) {
          await db.expenses.update(r.id, { amount: template.defaultAmount });
        }
      }
      if (before.name !== template.name) {
        for (const r of rows.filter((r) => r.templateId === templateId && r.month >= current)) {
          await db.expenses.update(r.id, { note: template.name });
        }
      }
    }
    await db.expenses.bulkDelete(staleGeneratedRows(template, templateId, rows, current).map((r) => r.id));
  });
  return templateId;
}

/** Removes a template; past months keep their rows, unpaid rows from this month on go. */
export async function removeTemplate(id: string): Promise<void> {
  await db.transaction('rw', db.fixedTemplates, db.expenses, async () => {
    const rows = await db.expenses.where('categoryId').equals(FIXED_CATEGORY_ID).toArray();
    await db.expenses.bulkDelete(staleGeneratedRows(null, id, rows, currentMonthKey()).map((r) => r.id));
    await db.fixedTemplates.delete(id);
  });
}
