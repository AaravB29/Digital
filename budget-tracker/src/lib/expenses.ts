import type { Expense } from '../db/types';

/** Newest date first; same-day entries newest-created first. Returns a new array. */
export function sortExpensesByDate<T extends Pick<Expense, 'date' | 'createdAt'>>(expenses: T[]): T[] {
  return [...expenses].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );
}

/** Random id for new records; falls back when crypto.randomUUID is unavailable (non-HTTPS). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
