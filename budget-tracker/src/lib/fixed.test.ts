import { describe, expect, it } from 'vitest';
import type { Expense, FixedExpenseTemplate } from '../db/types';
import {
  activeTemplatesForMonth,
  applyFixedAmountEdit,
  fixedDueDate,
  fixedExpenseId,
  fixedSummary,
  isTemplateActive,
  missingFixedExpenses,
  ordinal,
  rowsToRetarget,
  splitFixedRows,
  staleGeneratedRows,
  validateTemplate,
} from './fixed';

const tpl = (over: Partial<FixedExpenseTemplate> = {}): FixedExpenseTemplate => ({
  id: 'rent', name: 'Rent', kind: 'rent', defaultAmount: 65000, dayOfMonth: 1, activeFrom: '2026-11', ...over,
});
const NOW = '2026-11-10T12:00:00.000Z';
const gen = (templates: FixedExpenseTemplate[], month: string, existing: Expense[] = []) =>
  missingFixedExpenses(templates, existing, month, 'fixed', NOW);

describe('isTemplateActive', () => {
  it('includes the start and end months', () => {
    const t = tpl({ activeFrom: '2026-11', activeUntil: '2027-02' });
    expect(isTemplateActive(t, '2026-10')).toBe(false);
    expect(isTemplateActive(t, '2026-11')).toBe(true);
    expect(isTemplateActive(t, '2027-02')).toBe(true);
    expect(isTemplateActive(t, '2027-03')).toBe(false);
  });

  it('runs forever without an end month, including across years', () => {
    expect(isTemplateActive(tpl(), '2030-01')).toBe(true);
    expect(isTemplateActive(tpl({ activeFrom: '2026-12' }), '2027-01')).toBe(true);
  });

  it('filters a list by month', () => {
    const list = [tpl(), tpl({ id: 'netflix', activeUntil: '2026-12' }), tpl({ id: 'gym', activeFrom: '2027-01' })];
    expect(activeTemplatesForMonth(list, '2026-12').map((t) => t.id)).toEqual(['rent', 'netflix']);
    expect(activeTemplatesForMonth(list, '2027-01').map((t) => t.id)).toEqual(['rent', 'gym']);
  });
});

describe('missingFixedExpenses', () => {
  it('creates one row per active template with the default amount and due date', () => {
    const rows = gen([tpl({ dayOfMonth: 3 }), tpl({ id: 'spotify', name: 'Spotify', defaultAmount: 1099 })], '2026-12');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: 'fixed:rent:2026-12', month: '2026-12', date: '2026-12-03', amount: 65000,
      categoryId: 'fixed', note: 'Rent', templateId: 'rent', isOverridden: false, isPaid: false,
    });
    expect(rows[1].amount).toBe(1099);
  });

  it('never duplicates a row that already exists', () => {
    const first = gen([tpl()], '2026-12');
    expect(gen([tpl()], '2026-12', first)).toEqual([]);
    // also when the existing row has a different id but the same template
    expect(gen([tpl()], '2026-12', [{ ...first[0], id: 'other' }])).toEqual([]);
  });

  it('skips months before the start and after the end', () => {
    expect(gen([tpl({ activeFrom: '2026-12' })], '2026-11')).toEqual([]);
    expect(gen([tpl({ activeUntil: '2026-11' })], '2026-12')).toEqual([]);
  });

  it('keeps an edited row instead of adding the default again', () => {
    const [row] = gen([tpl()], '2026-12');
    const edited = { ...row, amount: 70000, isOverridden: true };
    expect(gen([tpl()], '2026-12', [edited])).toEqual([]);
  });
});

describe('due dates and ids', () => {
  it('clamps the day to 1–28', () => {
    expect(fixedDueDate({ dayOfMonth: 15 }, '2027-02')).toBe('2027-02-15');
    expect(fixedDueDate({ dayOfMonth: 31 }, '2027-02')).toBe('2027-02-28');
    expect(fixedDueDate({ dayOfMonth: 0 }, '2027-02')).toBe('2027-02-01');
  });

  it('builds a stable id per template and month', () => {
    expect(fixedExpenseId('rent', '2026-12')).toBe('fixed:rent:2026-12');
  });
});

describe('per-month overrides', () => {
  it('marks a changed amount as edited and a default amount as not edited', () => {
    expect(applyFixedAmountEdit(70000, tpl())).toEqual({ amount: 70000, isOverridden: true });
    expect(applyFixedAmountEdit(65000, tpl())).toEqual({ amount: 65000, isOverridden: false });
  });

  it("editing December's row leaves November's untouched", () => {
    const nov = gen([tpl()], '2026-11')[0];
    const dec = { ...gen([tpl()], '2026-12')[0], ...applyFixedAmountEdit(70000, tpl()) };
    expect(nov.amount).toBe(65000);
    expect(dec.amount).toBe(70000);
  });
});

describe('rowsToRetarget', () => {
  const rows = ['2026-10', '2026-11', '2026-12', '2027-01'].map((m) => gen([tpl({ activeFrom: '2026-01' })], m)[0]);
  rows[3] = { ...rows[3], isOverridden: true, amount: 1 };

  it('updates this month onward, skipping edited rows', () => {
    expect(rowsToRetarget(rows, 'rent', 'this_month_onward', '2026-11').map((r) => r.month)).toEqual(['2026-11', '2026-12']);
  });

  it('updates future months only', () => {
    expect(rowsToRetarget(rows, 'rent', 'future_only', '2026-11').map((r) => r.month)).toEqual(['2026-12']);
  });

  it('ignores other templates', () => {
    expect(rowsToRetarget(rows, 'netflix', 'this_month_onward', '2026-11')).toEqual([]);
  });
});

describe('staleGeneratedRows', () => {
  const t = tpl({ id: 'netflix', activeFrom: '2026-11' });
  const rows = ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03'].map((m) => gen([t], m)[0]);

  it('drops rows after a new end month', () => {
    const ended = { ...t, activeUntil: '2027-01' };
    expect(staleGeneratedRows(ended, 'netflix', rows, '2026-11').map((r) => r.month)).toEqual(['2027-02', '2027-03']);
  });

  it('keeps paid or edited rows', () => {
    const ended = { ...t, activeUntil: '2027-01' };
    const kept = rows.map((r) => (r.month === '2027-02' ? { ...r, isPaid: true } : r.month === '2027-03' ? { ...r, isOverridden: true } : r));
    expect(staleGeneratedRows(ended, 'netflix', kept, '2026-11')).toEqual([]);
  });

  it('on removal, drops rows from this month on but keeps past months', () => {
    expect(staleGeneratedRows(null, 'netflix', rows, '2027-01').map((r) => r.month)).toEqual(['2027-01', '2027-02', '2027-03']);
  });
});

describe('fixedSummary', () => {
  it('splits paid and still due', () => {
    expect(fixedSummary([{ amount: 65000, isPaid: true }, { amount: 1099, isPaid: false }, { amount: 2000 }])).toEqual({
      total: 68099, paid: 65000, due: 3099, count: 3, paidCount: 1,
    });
  });
});

describe('validateTemplate', () => {
  const ok = { name: 'Rent', amountText: '650,00', dayOfMonth: 1, activeFrom: '2026-11' };
  it('accepts a valid draft and parses cents', () => {
    expect(validateTemplate(ok)).toEqual({ amount: 65000 });
    expect(validateTemplate({ ...ok, amountText: '' })).toEqual({ amount: 0 });
  });
  it.each([
    [{ name: ' ' }, 'name'],
    [{ amountText: 'abc' }, 'amount'],
    [{ dayOfMonth: 29 }, 'Due day'],
    [{ activeUntil: '2026-10' }, 'end month'],
  ])('rejects %j', (over, msg) => {
    const r = validateTemplate({ ...ok, ...over });
    expect('error' in r && r.error).toContain(msg);
  });
});

describe('splitFixedRows', () => {
  it('separates generated rows and orders them by due date then name', () => {
    const rows = [
      { id: 'a', date: '2026-11-09', note: 'Coffee' },
      { id: 'b', date: '2026-11-15', note: 'Spotify', templateId: 'spotify' },
      { id: 'c', date: '2026-11-01', note: 'Rent', templateId: 'rent' },
      { id: 'd', date: '2026-11-01', note: 'Health Insurance', templateId: 'hi' },
    ];
    const { fixed, variable } = splitFixedRows(rows);
    expect(fixed.map((r) => r.id)).toEqual(['d', 'c', 'b']);
    expect(variable.map((r) => r.id)).toEqual(['a']);
  });
});

describe('ordinal', () => {
  it.each([[1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [11, '11th'], [12, '12th'], [13, '13th'], [21, '21st'], [22, '22nd'], [28, '28th']])(
    '%i → %s',
    (n, s) => expect(ordinal(n)).toBe(s),
  );
});
