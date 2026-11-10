import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { ensureFixedExpenses } from '../db/fixedActions';
import type { FixedExpenseTemplate, MonthKey } from '../db/types';

/**
 * Generates the month's fixed rows when the month is opened, and again whenever
 * templates change. Returns the templates so rows can show their current name and default.
 */
export function useFixedExpenses(month: MonthKey | null): FixedExpenseTemplate[] {
  const templates = useLiveQuery(() => db.fixedTemplates.toArray(), []);
  useEffect(() => {
    if (month && templates) void ensureFixedExpenses(month);
  }, [month, templates]);
  return templates ?? [];
}
