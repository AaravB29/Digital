import { describe, expect, it } from 'vitest';
import type { Category } from '../db/types';
import {
  budgetStatus,
  categoryId,
  filterAndSortExpenses,
  moveCategory,
  selectableCategories,
  tabCategories,
  validateCategory,
} from './categories';

const cat = (id: string, sortOrder: number, over: Partial<Category> = {}): Category => ({
  id, name: id, color: '#000', isFixed: false, archived: false, sortOrder, ...over,
});

describe('budgetStatus', () => {
  it('has no status without a budget', () => {
    expect(budgetStatus(500, undefined)).toBeNull();
    expect(budgetStatus(500, 0)).toBeNull();
  });

  it('is green below 80 %, amber from 80 % up to 100 %, red above', () => {
    expect(budgetStatus(7999, 10000)).toEqual({ percent: 80, level: 'ok' }); // 79.99 % rounds to 80 but is still green
    expect(budgetStatus(8000, 10000)).toEqual({ percent: 80, level: 'warn' });
    expect(budgetStatus(10000, 10000)).toEqual({ percent: 100, level: 'warn' });
    expect(budgetStatus(10001, 10000)).toEqual({ percent: 100, level: 'over' });
    expect(budgetStatus(15000, 10000)).toEqual({ percent: 150, level: 'over' });
    expect(budgetStatus(0, 10000)).toEqual({ percent: 0, level: 'ok' });
  });
});

describe('tabCategories', () => {
  const cats = [cat('b', 1), cat('a', 0), cat('old', 2, { archived: true }), cat('gone', 3, { archived: true })];

  it('shows active categories in sort order and hides archived ones without spending', () => {
    expect(tabCategories(cats, new Map()).map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('keeps an archived category visible while it has spending that month', () => {
    expect(tabCategories(cats, new Map([['old', 500]])).map((c) => c.id)).toEqual(['a', 'b', 'old']);
  });
});

describe('selectableCategories', () => {
  it('offers active categories plus the expense’s current one', () => {
    const cats = [cat('a', 0), cat('old', 1, { archived: true })];
    expect(selectableCategories(cats).map((c) => c.id)).toEqual(['a']);
    expect(selectableCategories(cats, 'old').map((c) => c.id)).toEqual(['a', 'old']);
  });
});

describe('filterAndSortExpenses', () => {
  const names = new Map([['groceries', 'Groceries'], ['transport', 'Transport']]);
  const rows = [
    { id: '1', note: 'Rewe', categoryId: 'groceries', amount: 1250, date: '2026-11-02', createdAt: '1' },
    { id: '2', note: 'Bus ticket', categoryId: 'transport', amount: 320, date: '2026-11-09', createdAt: '2' },
    { id: '3', note: 'Aldi', categoryId: 'groceries', amount: 4580, date: '2026-11-05', createdAt: '3' },
    { id: '4', note: undefined, categoryId: 'transport', amount: 4900, date: '2026-11-05', createdAt: '4' },
  ];

  it('sorts newest first by default, then most recently created', () => {
    expect(filterAndSortExpenses(rows, '', 'date', names).map((r) => r.id)).toEqual(['2', '4', '3', '1']);
  });

  it('sorts by amount, largest first', () => {
    expect(filterAndSortExpenses(rows, '', 'amount', names).map((r) => r.id)).toEqual(['4', '3', '1', '2']);
  });

  it('searches notes and category names, ignoring case', () => {
    expect(filterAndSortExpenses(rows, 'rewe', 'date', names).map((r) => r.id)).toEqual(['1']);
    expect(filterAndSortExpenses(rows, ' TRANSPORT ', 'date', names).map((r) => r.id)).toEqual(['2', '4']);
    expect(filterAndSortExpenses(rows, 'nothing', 'date', names)).toEqual([]);
  });
});

describe('moveCategory', () => {
  const cats = [cat('a', 0), cat('b', 1), cat('c', 5)];

  it('swaps with the neighbour and renumbers from 0', () => {
    expect(moveCategory(cats, 'c', -1)).toEqual([{ id: 'a', sortOrder: 0 }, { id: 'c', sortOrder: 1 }, { id: 'b', sortOrder: 2 }]);
    expect(moveCategory(cats, 'a', 1)).toEqual([{ id: 'b', sortOrder: 0 }, { id: 'a', sortOrder: 1 }, { id: 'c', sortOrder: 2 }]);
  });

  it('refuses to move past either end', () => {
    expect(moveCategory(cats, 'a', -1)).toBeNull();
    expect(moveCategory(cats, 'c', 1)).toBeNull();
    expect(moveCategory(cats, 'missing', 1)).toBeNull();
  });
});

describe('validateCategory', () => {
  const others = [{ name: 'Groceries' }];

  it('accepts a name with or without a budget', () => {
    expect(validateCategory({ name: ' Gifts ', budgetText: '' }, others)).toEqual({ name: 'Gifts', monthlyBudget: undefined });
    expect(validateCategory({ name: 'Gifts', budgetText: '50' }, others)).toEqual({ name: 'Gifts', monthlyBudget: 5000 });
    expect(validateCategory({ name: 'Gifts', budgetText: '0' }, others)).toEqual({ name: 'Gifts', monthlyBudget: undefined });
  });

  it('rejects empty and duplicate names and bad budgets', () => {
    expect(validateCategory({ name: '', budgetText: '' }, others)).toHaveProperty('error');
    expect(validateCategory({ name: 'groceries', budgetText: '' }, others)).toHaveProperty('error');
    expect(validateCategory({ name: 'Gifts', budgetText: 'lots' }, others)).toHaveProperty('error');
  });
});

describe('categoryId', () => {
  it('makes a unique slug', () => {
    expect(categoryId('Gifts & Cards', [])).toBe('gifts-cards');
    expect(categoryId('Gym', ['gym'])).toBe('gym-2');
    expect(categoryId('Gym', ['gym', 'gym-2'])).toBe('gym-3');
    expect(categoryId('🎁', [])).toBe('category');
  });
});
