import { db } from './dexie';
import type { Expense } from './types';
import { generateSampleData, SAMPLE_PREFIX } from '../lib/sampleData';
import { addMonths, currentMonthKey, monthsInRange } from '../lib/months';

/**
 * Adds six months of sample data ending last month, so the current month stays yours.
 * Fixed rows are skipped where a real fixed expense of the same name already exists.
 * Every sample row has an id starting with "sample:" and can be removed in one go.
 */
export async function loadSampleData(): Promise<number> {
  const last = addMonths(currentMonthKey(), -1);
  const months = monthsInRange(addMonths(last, -5), last);
  const { expenses, incomes } = generateSampleData(months);

  return db.transaction('rw', db.expenses, db.incomes, db.categories, db.fixedTemplates, async () => {
    const categories = await db.categories.toArray();
    const ids = new Set(categories.map((c) => c.id));
    const fallback = ids.has('other') ? 'other' : categories.find((c) => !c.isFixed && !c.archived)?.id ?? 'fixed';
    const templates = new Map((await db.fixedTemplates.toArray()).map((t) => [t.id, t]));
    const existing = await db.expenses.where('month').between(months[0], months[months.length - 1], true, true).toArray();
    const realFixed = new Set(
      existing.filter((e) => e.templateId && !e.id.startsWith(SAMPLE_PREFIX)).map((e) => `${e.month}|${(templates.get(e.templateId!)?.name ?? e.note ?? '').toLowerCase()}`),
    );

    const rows: Expense[] = expenses
      .filter((e) => !e.fixedKind || !realFixed.has(`${e.month}|${(e.note ?? '').toLowerCase()}`))
      .map(({ fixedKind: _kind, ...e }) => ({ ...e, categoryId: ids.has(e.categoryId) ? e.categoryId : fallback }));
    await db.expenses.bulkPut(rows);
    await db.incomes.bulkPut(incomes);
    return rows.length;
  });
}

export async function removeSampleData(): Promise<void> {
  await db.transaction('rw', db.expenses, db.incomes, async () => {
    await db.expenses.where(':id').startsWith(SAMPLE_PREFIX).delete();
    await db.incomes.where(':id').startsWith(SAMPLE_PREFIX).delete();
  });
}

export function countSampleExpenses(): Promise<number> {
  return db.expenses.where(':id').startsWith(SAMPLE_PREFIX).count();
}
