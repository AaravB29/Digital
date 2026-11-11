import { describe, expect, it } from 'vitest';
import type { Category, Expense } from '../db/types';
import { centsToDecimal, csvField, expensesToCsv } from './csv';

describe('centsToDecimal', () => {
  it.each([[1250, '12.50'], [5, '0.05'], [0, '0.00'], [123456, '1234.56'], [-750, '-7.50'], [100, '1.00']])('%i → %s', (c, s) =>
    expect(centsToDecimal(c)).toBe(s),
  );
  it('refuses fractions', () => expect(() => centsToDecimal(1.5)).toThrow());
});

describe('csvField', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('Rewe, Aldi')).toBe('"Rewe, Aldi"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('two\nlines')).toBe('"two\nlines"');
    expect(csvField(undefined)).toBe('');
  });
  it('defuses spreadsheet formulas', () => {
    expect(csvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvField('-5 refund')).toBe("'-5 refund");
    expect(csvField('@home')).toBe("'@home");
  });
});

describe('expensesToCsv', () => {
  const cats: Category[] = [
    { id: 'fixed', name: 'Fixed', color: '#000', isFixed: true, archived: false, sortOrder: 0 },
    { id: 'groceries', name: 'Groceries', color: '#000', isFixed: false, archived: false, sortOrder: 1 },
  ];
  const base = { createdAt: '2026-11-01T00:00:00Z' };
  const rows: Expense[] = [
    { id: '2', month: '2026-11', date: '2026-11-09', amount: 1250, categoryId: 'groceries', note: 'Rewe, big shop', ...base },
    { id: '1', month: '2026-11', date: '2026-11-01', amount: 65000, categoryId: 'fixed', note: 'Rent', templateId: 'rent', isPaid: true, ...base },
  ];

  it('marks anything in a fixed category as Fixed, generated or not', () => {
    const manual: Expense = { id: '3', month: '2026-11', date: '2026-11-02', amount: 2000, categoryId: 'fixed', note: 'Gym', ...base };
    expect(expensesToCsv([manual], cats, [], 'EUR').split('\r\n')[1]).toBe('2026-11-02,2026-11,Fixed,Gym,20.00,EUR,Fixed,');
  });

  it('writes a header and one row per expense, oldest first', () => {
    expect(expensesToCsv(rows, cats, [{ id: 'rent', name: 'Miete', kind: 'rent', defaultAmount: 65000, dayOfMonth: 1, activeFrom: '2026-11' }], 'EUR')).toBe(
      'Date,Month,Category,Note,Amount,Currency,Type,Paid\r\n' +
        '2026-11-01,2026-11,Fixed,Miete,650.00,EUR,Fixed,yes\r\n' +
        '2026-11-09,2026-11,Groceries,"Rewe, big shop",12.50,EUR,Variable,\r\n',
    );
  });
});
