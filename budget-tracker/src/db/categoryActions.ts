import { db } from './dexie';
import type { Category } from './types';
import { categoryId, moveCategory } from '../lib/categories';

export type CategoryInput = Pick<Category, 'name' | 'color' | 'icon' | 'monthlyBudget'>;

export async function addCategory(input: CategoryInput): Promise<string> {
  return db.transaction('rw', db.categories, async () => {
    const all = await db.categories.toArray();
    const id = categoryId(input.name, all.map((c) => c.id));
    const sortOrder = all.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1;
    await db.categories.add({ ...input, id, isFixed: false, archived: false, sortOrder });
    return id;
  });
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  // Dexie deletes a field set to undefined, so an emptied budget or icon is removed.
  await db.categories.update(id, { ...input, monthlyBudget: input.monthlyBudget, icon: input.icon || undefined });
}

export async function reorderCategory(id: string, direction: -1 | 1): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    const order = moveCategory(await db.categories.toArray(), id, direction);
    if (order) await db.categories.bulkUpdate(order.map(({ id, sortOrder }) => ({ key: id, changes: { sortOrder } })));
  });
}

export async function setCategoryArchived(id: string, archived: boolean): Promise<void> {
  const category = await db.categories.get(id);
  if (category?.isFixed) throw new Error('The Fixed category holds your fixed expenses and cannot be archived.');
  await db.categories.update(id, { archived });
}

export function countCategoryExpenses(id: string): Promise<number> {
  return db.expenses.where('categoryId').equals(id).count();
}

/** Deletes a category that has no expenses. */
export async function deleteCategory(id: string): Promise<void> {
  await db.transaction('rw', db.categories, db.expenses, async () => {
    const category = await db.categories.get(id);
    if (category?.isFixed) throw new Error('The Fixed category cannot be deleted.');
    if ((await db.expenses.where('categoryId').equals(id).count()) > 0) {
      throw new Error('This category still has expenses. Archive it or move them first.');
    }
    await db.categories.delete(id);
  });
}

/** Moves every expense of `fromId` into `toId`, then deletes `fromId`. */
export async function moveExpensesAndDelete(fromId: string, toId: string): Promise<number> {
  if (fromId === toId) throw new Error('Choose a different category.');
  return db.transaction('rw', db.categories, db.expenses, async () => {
    const [from, to] = await Promise.all([db.categories.get(fromId), db.categories.get(toId)]);
    if (!from || !to) throw new Error('Category not found.');
    if (from.isFixed) throw new Error('The Fixed category cannot be deleted.');
    const moved = await db.expenses.where('categoryId').equals(fromId).modify({ categoryId: toId });
    await db.categories.delete(fromId);
    return moved;
  });
}
