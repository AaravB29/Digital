/** Month identifier in the form "YYYY-MM", e.g. "2026-11". */
export type MonthKey = string;

export interface Category {
  id: string;
  name: string;
  /** Hex colour used in charts and tabs. */
  color: string;
  icon?: string;
  /** True for the "Fixed" group that holds generated fixed expenses. */
  isFixed: boolean;
  /** Optional monthly limit, in cents. */
  monthlyBudget?: number;
  /** Hidden from tabs but kept for history. */
  archived: boolean;
  sortOrder: number;
}

export type FixedExpenseKind = 'rent' | 'health_insurance' | 'subscription' | 'other_fixed';

export interface FixedExpenseTemplate {
  id: string;
  name: string;
  kind: FixedExpenseKind;
  /** Cents. */
  defaultAmount: number;
  /** 1–28, the day it is due. */
  dayOfMonth: number;
  /** First month it applies. */
  activeFrom: MonthKey;
  /** Last month it applies; undefined means still active. */
  activeUntil?: MonthKey;
}

export interface Expense {
  id: string;
  month: MonthKey;
  /** ISO date, e.g. "2026-11-10". */
  date: string;
  /** Cents, always positive. */
  amount: number;
  categoryId: string;
  note?: string;
  /** Set when this row was generated from a fixed template. */
  templateId?: string;
  /** True when the user changed a generated fixed amount for this month. */
  isOverridden?: boolean;
  createdAt: string;
}

export interface Income {
  id: string;
  month: MonthKey;
  /** Cents. */
  amount: number;
  source: string;
}

export const SETTINGS_ID = 'app';

/** Single-row table; the row always has id "app". */
export interface Settings {
  id: typeof SETTINGS_ID;
  currency: string;
  locale: string;
  startOfMonthDay: number;
}
