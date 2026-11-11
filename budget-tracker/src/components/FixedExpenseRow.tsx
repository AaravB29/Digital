import { useId, useState, type FormEvent } from 'react';
import type { Expense, FixedExpenseTemplate } from '../db/types';
import { formatMoney, formatMoneyForInput, parseMoney, type MoneyFormat } from '../lib/money';
import { inputBase } from './fieldStyles';
import { ordinal } from '../lib/fixed';

interface Props {
  row: Expense;
  template?: FixedExpenseTemplate;
  moneyFormat: MoneyFormat;
  onTogglePaid: (row: Expense, paid: boolean) => void;
  onEditAmount: (row: Expense, amount: number) => Promise<void>;
  onReset: (row: Expense) => void;
}

const smallButton = 'rounded-md px-2 py-1 text-xs font-medium hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-teal-600';

export default function FixedExpenseRow({ row, template, moneyFormat, onTogglePaid, onEditAmount, onReset }: Props) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const name = template?.name ?? row.note ?? 'Fixed expense';
  const day = Number(row.date.slice(8, 10));

  async function save(e: FormEvent) {
    e.preventDefault();
    const cents = parseMoney(text);
    if (cents === null) return setError('Enter a number, like 650,00.');
    await onEditAmount(row, cents);
    setEditing(false);
  }

  return (
    <li className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 ${row.isPaid ? 'bg-slate-50' : 'bg-amber-50/50'}`}>
      <input
        id={`${id}-paid`}
        type="checkbox"
        className="h-5 w-5 accent-teal-700"
        checked={!!row.isPaid}
        onChange={(e) => onTogglePaid(row, e.target.checked)}
      />
      <label htmlFor={`${id}-paid`} className="min-w-0 flex-1 cursor-pointer">
        <span className={`block break-words ${row.isPaid ? 'text-slate-500 line-through' : ''}`}>
          <span aria-hidden>📌 </span>
          {name}
        </span>
        <span className="text-xs text-slate-500">
          due {ordinal(day)} · {row.isPaid ? 'paid' : 'unpaid'}
        </span>
      </label>
      {editing ? (
        <form onSubmit={save} className="flex items-center gap-2">
          <input
            aria-label={`Amount for ${name} this month`}
            className={`${inputBase} w-28 py-1 tabular-nums`}
            inputMode="decimal"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
          />
          <button type="submit" className={`${smallButton} bg-teal-700 text-white hover:bg-teal-800`}>Save</button>
          <button type="button" className={smallButton} onClick={() => setEditing(false)}>Cancel</button>
          {error && <span role="alert" className="w-full text-xs text-red-700">{error}</span>}
        </form>
      ) : (
        <div className="flex items-center gap-1">
          {row.isOverridden && (
            <>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">edited</span>
              {template && (
                <button type="button" className={smallButton} title={`Back to ${formatMoney(template.defaultAmount, moneyFormat)}`} onClick={() => onReset(row)}>
                  Reset
                </button>
              )}
            </>
          )}
          <span className="px-1 font-medium tabular-nums">{formatMoney(row.amount, moneyFormat)}</span>
          <button
            type="button"
            aria-label={`Change ${name} for this month`}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            onClick={() => {
              setText(formatMoneyForInput(row.amount, moneyFormat.locale));
              setError(null);
              setEditing(true);
            }}
          >
            ✏️
          </button>
        </div>
      )}
    </li>
  );
}
