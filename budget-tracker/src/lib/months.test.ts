import { describe, expect, it } from 'vitest';
import {
  addMonths,
  compareMonths,
  currentMonthKey,
  defaultExpenseDate,
  isDateInMonth,
  isFutureMonth,
  monthDateBounds,
  formatMonthLabel,
  isMonthKey,
  monthKeyToDate,
  monthOfIsoDate,
  monthsInRange,
  presetRange,
  shortMonthLabel,
  nextMonth,
  prevMonth,
  toMonthKey,
} from './months';

describe('month keys', () => {
  it('validates the YYYY-MM format', () => {
    expect(isMonthKey('2026-11')).toBe(true);
    expect(isMonthKey('2026-01')).toBe(true);
    for (const bad of ['2026-13', '2026-00', '2026-1', '26-11', '2026/11', '2026-11-01', '']) {
      expect(isMonthKey(bad)).toBe(false);
    }
  });

  it('converts between dates and keys', () => {
    expect(toMonthKey(new Date(2026, 10, 30, 23, 59))).toBe('2026-11');
    const d = monthKeyToDate('2026-11');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 10, 1, 0]);
    expect(toMonthKey(monthKeyToDate('2027-02'))).toBe('2027-02');
    expect(() => monthKeyToDate('2026-13')).toThrow();
  });

  it('reads the current month from the given date', () => {
    expect(currentMonthKey(new Date(2026, 10, 10))).toBe('2026-11');
  });

  it('extracts the month from an ISO date', () => {
    expect(monthOfIsoDate('2026-11-10')).toBe('2026-11');
    expect(() => monthOfIsoDate('nope')).toThrow();
  });
});

describe('month arithmetic', () => {
  it('moves forward and back across year boundaries', () => {
    expect(nextMonth('2026-11')).toBe('2026-12');
    expect(nextMonth('2026-12')).toBe('2027-01');
    expect(prevMonth('2027-01')).toBe('2026-12');
    expect(prevMonth('2026-03')).toBe('2026-02');
    expect(addMonths('2026-11', 14)).toBe('2028-01');
    expect(addMonths('2026-11', -23)).toBe('2024-12');
    expect(addMonths('2026-11', 0)).toBe('2026-11');
  });

  it('compares months', () => {
    expect(compareMonths('2026-11', '2026-12')).toBeLessThan(0);
    expect(compareMonths('2027-01', '2026-12')).toBeGreaterThan(0);
    expect(compareMonths('2026-11', '2026-11')).toBe(0);
  });

  it('lists months in a range, inclusive', () => {
    expect(monthsInRange('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(monthsInRange('2026-11', '2026-11')).toEqual(['2026-11']);
    expect(monthsInRange('2026-12', '2026-11')).toEqual([]);
    expect(monthsInRange('2026-01', '2026-12')).toHaveLength(12);
  });
});

describe('formatMonthLabel', () => {
  it('shows the full month name and year', () => {
    expect(formatMonthLabel('2026-11')).toBe('November 2026');
    expect(formatMonthLabel('2027-01')).toBe('January 2027');
  });
});

describe('month entry helpers', () => {
  const now = new Date(2026, 10, 10, 15, 30);

  it('flags months after the current one as future', () => {
    expect(isFutureMonth('2026-12', now)).toBe(true);
    expect(isFutureMonth('2027-01', now)).toBe(true);
    expect(isFutureMonth('2026-11', now)).toBe(false);
    expect(isFutureMonth('2026-10', now)).toBe(false);
  });

  it('gives first and last day of a month, including leap years', () => {
    expect(monthDateBounds('2026-11')).toEqual(['2026-11-01', '2026-11-30']);
    expect(monthDateBounds('2026-12')).toEqual(['2026-12-01', '2026-12-31']);
    expect(monthDateBounds('2027-02')).toEqual(['2027-02-01', '2027-02-28']);
    expect(monthDateBounds('2028-02')).toEqual(['2028-02-01', '2028-02-29']);
  });

  it('defaults new expense dates to today in the current month, else the 1st', () => {
    expect(defaultExpenseDate('2026-11', now)).toBe('2026-11-10');
    expect(defaultExpenseDate('2026-10', now)).toBe('2026-10-01');
    expect(defaultExpenseDate('2027-03', now)).toBe('2027-03-01');
  });

  it('checks whether a date belongs to a month', () => {
    expect(isDateInMonth('2026-11-30', '2026-11')).toBe(true);
    expect(isDateInMonth('2026-12-01', '2026-11')).toBe(false);
    expect(isDateInMonth('', '2026-11')).toBe(false);
  });
});

describe('ranges for trends', () => {
  const now = new Date(2026, 10, 11);
  it('ends every preset in the current month', () => {
    expect(presetRange('last3', now)).toEqual(['2026-09', '2026-11']);
    expect(presetRange('last6', now)).toEqual(['2026-06', '2026-11']);
    expect(presetRange('last12', now)).toEqual(['2025-12', '2026-11']);
    expect(presetRange('thisYear', now)).toEqual(['2026-01', '2026-11']);
    expect(presetRange('thisYear', new Date(2027, 0, 5))).toEqual(['2027-01', '2027-01']);
  });
  it('makes short axis labels', () => {
    expect(shortMonthLabel('2026-11')).toBe('Nov 26');
  });
});
