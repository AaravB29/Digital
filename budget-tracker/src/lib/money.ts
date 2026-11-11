/**
 * Money helpers. All amounts are integer cents; floats never hold money.
 */

export interface MoneyFormat {
  currency: string;
  locale: string;
}

export const DEFAULT_MONEY_FORMAT: MoneyFormat = { currency: 'EUR', locale: 'de-DE' };

const THOUSANDS_GROUPED = /^\d{1,3}(?:[.,]\d{3})+$/;

/**
 * Parse user input into cents. Accepts "12,50", "12.50", "12", "12,5", ",5",
 * "1.234,56", "1,234.56", "1.234" (= 1234) and an optional € / EUR sign.
 * Returns null for empty, negative or otherwise invalid input, or more than 2 decimals.
 */
export function parseMoney(input: string): number | null {
  const s = input.replace(/€|eur/gi, '').replace(/[\s  ]/g, '');
  if (s === '' || !/^[\d.,]+$/.test(s)) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let intPart = s;
  let fracPart = '';

  if (lastComma >= 0 && lastDot >= 0) {
    // Both present: the later one is the decimal separator.
    const decIdx = Math.max(lastComma, lastDot);
    intPart = s.slice(0, decIdx);
    fracPart = s.slice(decIdx + 1);
    const thousandsSep = s[decIdx] === ',' ? '.' : ',';
    if (intPart.includes(s[decIdx]) || !matchesGrouping(intPart, thousandsSep)) return null;
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.';
    const parts = s.split(sep);
    const isThousands =
      parts.length > 2 || (parts[1].length === 3 && parts[0] !== '' && parts[0] !== '0');
    if (isThousands) {
      if (!THOUSANDS_GROUPED.test(s)) return null;
    } else {
      [intPart, fracPart] = parts;
    }
  }

  intPart = intPart.replace(/[.,]/g, '');
  if (fracPart.length > 2 || !/^\d*$/.test(fracPart)) return null;
  if (intPart === '' && fracPart === '') return null;

  const cents = Number(intPart || '0') * 100 + Number(fracPart.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

function matchesGrouping(intPart: string, sep: string): boolean {
  if (!intPart.includes(sep)) return /^\d*$/.test(intPart);
  return THOUSANDS_GROUPED.test(intPart) && !intPart.includes(sep === ',' ? '.' : ',');
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Format cents for display, e.g. 1250 → "12,50 €" (de-DE, EUR). */
export function formatMoney(cents: number, format: MoneyFormat = DEFAULT_MONEY_FORMAT): string {
  if (!Number.isInteger(cents)) throw new Error(`Money must be integer cents, got ${cents}`);
  const key = `${format.locale}|${format.currency}`;
  let nf = formatters.get(key);
  if (!nf) {
    nf = new Intl.NumberFormat(format.locale, { style: 'currency', currency: format.currency });
    formatters.set(key, nf);
  }
  return nf.format(cents / 100);
}

/** Cents → plain editable text without currency or grouping, e.g. 1250 → "12,50" (de-DE). */
export function formatMoneyForInput(cents: number, locale: string = DEFAULT_MONEY_FORMAT.locale): string {
  if (!Number.isInteger(cents)) throw new Error(`Money must be integer cents, got ${cents}`);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(cents / 100);
}

/** Whole-unit amount for chart axes, e.g. 65000 → "650 €". Rounded, so display only. */
export function formatMoneyShort(cents: number, format: MoneyFormat = DEFAULT_MONEY_FORMAT): string {
  return new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: format.currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}
