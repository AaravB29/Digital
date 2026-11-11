import { useId } from 'react';
import { db } from '../db/dexie';
import { SETTINGS_ID } from '../db/types';
import { useMoneyFormat } from '../hooks/useExpenses';
import { formatMoney } from '../lib/money';
import { inputClass, labelClass } from './fieldStyles';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'INR', 'PLN', 'SEK', 'CZK'];
const LOCALES: Array<[string, string]> = [
  ['de-DE', 'German (1.234,56)'], ['en-GB', 'English UK (1,234.56)'], ['en-US', 'English US (1,234.56)'],
  ['en-IN', 'English India (1,23,456.78)'], ['fr-FR', 'French (1 234,56)'],
];

export default function CurrencySettings() {
  const id = useId();
  const { currency, locale } = useMoneyFormat();
  const save = (changes: { currency?: string; locale?: string }) => void db.settings.update(SETTINGS_ID, changes);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-cur`} className={labelClass}>Currency</label>
          <select id={`${id}-cur`} className={inputClass} value={currency} onChange={(e) => save({ currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-loc`} className={labelClass}>Number format</label>
          <select id={`${id}-loc`} className={inputClass} value={locale} onChange={(e) => save({ locale: e.target.value })}>
            {LOCALES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Example: <span className="font-medium text-slate-900 tabular-nums">{formatMoney(123456, { currency, locale })}</span>. This only
        changes how amounts are shown; it does not convert them.
      </p>
    </div>
  );
}
