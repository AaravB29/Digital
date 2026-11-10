import { useId, useState, type FormEvent } from 'react';
import type { Category, Expense, MonthKey } from '../db/types';
import type { ExpenseInput } from '../db/actions';
import { formatMoneyForInput, parseMoney } from '../lib/money';
import { defaultExpenseDate, isDateInMonth, monthDateBounds } from '../lib/months';
import { inputClass, labelClass, primaryButton, secondaryButton } from './fieldStyles';

interface Props {
  month: MonthKey;
  categories: Category[];
  locale: string;
  /** When set, the form edits this expense instead of adding a new one. */
  initial?: Expense;
  defaultCategoryId?: string;
  onSubmit: (input: ExpenseInput) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export default function ExpenseForm({ month, categories, locale, initial, defaultCategoryId, onSubmit, onCancel, autoFocus }: Props) {
  const id = useId();
  const [amount, setAmount] = useState(initial ? formatMoneyForInput(initial.amount, locale) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? '');
  const [date, setDate] = useState(initial?.date ?? defaultExpenseDate(month));
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [minDate, maxDate] = monthDateBounds(month);
  // Categories may arrive after the first render; fall back until the user picks one.
  const selectedCategoryId = categoryId || defaultCategoryId || categories[0]?.id || '';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cents = parseMoney(amount);
    if (cents === null || cents <= 0) return setError('Enter an amount above zero, like 12,50.');
    if (!selectedCategoryId) return setError('Choose a category.');
    if (!isDateInMonth(date, month)) return setError('Pick a date inside this month.');
    setError(null);
    await onSubmit({ amount: cents, categoryId: selectedCategoryId, date, note: note.trim() });
    if (!initial) {
      setAmount('');
      setNote('');
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`${id}-amount`} className={labelClass}>Amount</label>
        <input
          id={`${id}-amount`}
          className={`${inputClass} tabular-nums`}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={amount}
          autoFocus={autoFocus}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={`${id}-category`} className={labelClass}>Category</label>
        <select id={`${id}-category`} className={inputClass} value={selectedCategoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-date`} className={labelClass}>Date</label>
        <input id={`${id}-date`} type="date" className={inputClass} min={minDate} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${id}-note`} className={labelClass}>Note</label>
        <input id={`${id}-note`} className={inputClass} placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className={primaryButton}>{initial ? 'Save' : 'Add expense'}</button>
        {onCancel && (
          <button type="button" className={secondaryButton} onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
