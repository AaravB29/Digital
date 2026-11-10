import type { Category, FixedExpenseTemplate, MonthKey, Settings } from './types';
import { SETTINGS_ID } from './types';

export interface SeedData {
  categories: Category[];
  fixedTemplates: FixedExpenseTemplate[];
  settings: Settings;
}

/** Stable id of the built-in Fixed category. */
export const FIXED_CATEGORY_ID = 'fixed';

const CATEGORY_SEED: Array<[id: string, name: string, icon: string, color: string]> = [
  [FIXED_CATEGORY_ID, 'Fixed', '📌', '#475569'],
  ['groceries', 'Groceries', '🛒', '#16a34a'],
  ['eating-out', 'Eating Out', '🍕', '#ea580c'],
  ['transport', 'Transport', '🚆', '#2563eb'],
  ['shopping', 'Shopping', '🛍️', '#db2777'],
  ['education', 'Education', '📚', '#7c3aed'],
  ['health', 'Health & Pharmacy', '💊', '#dc2626'],
  ['leisure', 'Leisure', '🎉', '#ca8a04'],
  ['travel', 'Travel', '✈️', '#0891b2'],
  ['other', 'Other', '📦', '#78716c'],
];

const TEMPLATE_SEED: Array<[id: string, name: string, kind: FixedExpenseTemplate['kind']]> = [
  ['rent', 'Rent', 'rent'],
  ['health-insurance', 'Health Insurance', 'health_insurance'],
  ['mobile-plan', 'Mobile plan', 'subscription'],
  ['spotify', 'Spotify', 'subscription'],
  ['netflix', 'Netflix', 'subscription'],
];

/** Data written on first launch. Fixed templates start in `startMonth`. */
export function buildSeedData(startMonth: MonthKey): SeedData {
  return {
    categories: CATEGORY_SEED.map(([id, name, icon, color], i) => ({
      id,
      name,
      icon,
      color,
      isFixed: id === FIXED_CATEGORY_ID,
      archived: false,
      sortOrder: i,
    })),
    fixedTemplates: TEMPLATE_SEED.map(([id, name, kind]) => ({
      id,
      name,
      kind,
      defaultAmount: 0,
      dayOfMonth: 1,
      activeFrom: startMonth,
    })),
    settings: { id: SETTINGS_ID, currency: 'EUR', locale: 'de-DE', startOfMonthDay: 1 },
  };
}
