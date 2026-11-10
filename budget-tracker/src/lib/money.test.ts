import { describe, expect, it } from 'vitest';
import { formatMoney, parseMoney } from './money';

describe('parseMoney', () => {
  it.each([
    ['12,50', 1250],
    ['12.50', 1250],
    ['12', 1200],
    ['12,5', 1250],
    ['12.5', 1250],
    ['0,99', 99],
    [',5', 50],
    ['12,', 1200],
    ['0', 0],
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    ['1.234', 123400],
    ['1,234', 123400],
    ['1.234.567', 123456700],
    ['12,50 €', 1250],
    ['€12.50', 1250],
    [' 7 EUR ', 700],
    ['1 234,56', 123456],
    ['0.10', 10],
    ['0.1', 10],
  ])('parses %j as %i cents', (input, cents) => {
    expect(parseMoney(input)).toBe(cents);
  });

  it.each(['', '   ', 'abc', '-5', '12,345,6', '1.2.3', '12,345.678', '0.500', '1.234,5,6', '1,23.45', '12a', '.', ','])(
    'rejects %j',
    (input) => {
      expect(parseMoney(input)).toBeNull();
    },
  );

  it('never returns a fractional number', () => {
    for (const s of ['0,1', '0,01', '19,99', '33.33', '1.005,07']) {
      expect(Number.isInteger(parseMoney(s))).toBe(true);
    }
  });
});

const nbsp = (s: string) => s.replace(/[  ]/g, ' ');

describe('formatMoney', () => {
  it('formats cents in German EUR style by default', () => {
    expect(nbsp(formatMoney(1250))).toBe('12,50 €');
    expect(nbsp(formatMoney(0))).toBe('0,00 €');
    expect(nbsp(formatMoney(123456))).toBe('1.234,56 €');
    expect(nbsp(formatMoney(5))).toBe('0,05 €');
  });

  it('respects a different currency and locale', () => {
    expect(formatMoney(1250, { currency: 'USD', locale: 'en-US' })).toBe('$12.50');
  });

  it('round-trips with parseMoney', () => {
    for (const cents of [0, 1, 99, 1250, 123456]) {
      expect(parseMoney(formatMoney(cents))).toBe(cents);
    }
  });

  it('refuses non-integer input', () => {
    expect(() => formatMoney(12.5)).toThrow();
  });
});
