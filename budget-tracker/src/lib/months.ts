import { addDays, addMonths as addMonthsToDate, format, isValid, parse } from 'date-fns';
import type { MonthKey } from '../db/types';

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: string): value is MonthKey {
  return MONTH_KEY_RE.test(value);
}

function assertMonthKey(key: string): void {
  if (!isMonthKey(key)) throw new Error(`Invalid month key: ${key}`);
}

/** Date → "YYYY-MM" (local time). */
export function toMonthKey(date: Date): MonthKey {
  return format(date, 'yyyy-MM');
}

/** "YYYY-MM" → Date at local midnight on the 1st of that month. */
export function monthKeyToDate(key: MonthKey): Date {
  assertMonthKey(key);
  const date = parse(key, 'yyyy-MM', new Date(2000, 0, 1));
  if (!isValid(date)) throw new Error(`Invalid month key: ${key}`);
  return date;
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return toMonthKey(now);
}

export function addMonths(key: MonthKey, amount: number): MonthKey {
  return toMonthKey(addMonthsToDate(monthKeyToDate(key), amount));
}

export function nextMonth(key: MonthKey): MonthKey {
  return addMonths(key, 1);
}

export function prevMonth(key: MonthKey): MonthKey {
  return addMonths(key, -1);
}

/** Negative if a is before b, 0 if equal, positive if after. */
export function compareMonths(a: MonthKey, b: MonthKey): number {
  assertMonthKey(a);
  assertMonthKey(b);
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Every month from `from` to `to`, inclusive. Empty if `from` is after `to`. */
export function monthsInRange(from: MonthKey, to: MonthKey): MonthKey[] {
  const result: MonthKey[] = [];
  if (compareMonths(from, to) > 0) return result;
  for (let m = from; m <= to; m = nextMonth(m)) result.push(m);
  return result;
}

/** "2026-11" → "November 2026". */
export function formatMonthLabel(key: MonthKey): string {
  return format(monthKeyToDate(key), 'MMMM yyyy');
}

/** The month an ISO date ("2026-11-10") belongs to. */
export function monthOfIsoDate(isoDate: string): MonthKey {
  const key = isoDate.slice(0, 7);
  assertMonthKey(key);
  return key;
}

/** True if `key` is after the month containing `now` (used for the "planned" badge). */
export function isFutureMonth(key: MonthKey, now: Date = new Date()): boolean {
  return compareMonths(key, currentMonthKey(now)) > 0;
}

/** First and last ISO dates of a month, e.g. "2026-02" → ["2026-02-01", "2026-02-28"]. */
export function monthDateBounds(key: MonthKey): [string, string] {
  const first = monthKeyToDate(key);
  const last = addDays(addMonthsToDate(first, 1), -1);
  return [format(first, 'yyyy-MM-dd'), format(last, 'yyyy-MM-dd')];
}

/** Default date for a new expense: today when viewing the current month, else the 1st. */
export function defaultExpenseDate(key: MonthKey, now: Date = new Date()): string {
  return key === currentMonthKey(now) ? format(now, 'yyyy-MM-dd') : monthDateBounds(key)[0];
}

/** True if the ISO date falls inside the month. */
export function isDateInMonth(isoDate: string, key: MonthKey): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) && isoDate.slice(0, 7) === key;
}
