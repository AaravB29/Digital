import Dexie, { type EntityTable } from 'dexie';
import type { Category, Expense, FixedExpenseTemplate, Income, Settings } from './types';
import { buildSeedData } from './seed';
import { currentMonthKey } from '../lib/months';

export class BudgetDB extends Dexie {
  categories!: EntityTable<Category, 'id'>;
  fixedTemplates!: EntityTable<FixedExpenseTemplate, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  incomes!: EntityTable<Income, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor(name = 'budget-tracker') {
    super(name);
    this.version(1).stores({
      categories: 'id, sortOrder',
      fixedTemplates: 'id',
      expenses: 'id, month, categoryId, [month+categoryId], [month+templateId]',
      incomes: 'id, month',
      settings: 'id',
    });

    // Runs only once, when the database is first created.
    this.on('populate', async (tx) => {
      const seed = buildSeedData(currentMonthKey());
      await tx.table('categories').bulkAdd(seed.categories);
      await tx.table('fixedTemplates').bulkAdd(seed.fixedTemplates);
      await tx.table('settings').add(seed.settings);
    });
  }
}

export const db = new BudgetDB();
