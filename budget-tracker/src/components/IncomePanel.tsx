import { useId, useState, type FormEvent } from 'react';
import type { Income } from '../db/types';
import { formatMoney, parseMoney, type MoneyFormat } from '../lib/money';
import { inputClass, labelClass, secondaryButton } from './fieldStyles';

interface Props {
  incomes: Income[];
  moneyFormat: MoneyFormat;
  onAdd: (source: string, amount: number) => Promise<void>;
  onDelete: (income: Income) => void;
}

export default function IncomePanel({ incomes, moneyFormat, onAdd, onDelete }: Props) {
  const id = useId();
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cents = parseMoney(amount);
    if (cents === null || cents <= 0) return setError('Enter an amount above zero, like 850,00.');
    if (!source.trim()) return setError('Say where the money comes from, like "Part-time job".');
    setError(null);
    await onAdd(source.trim(), cents);
    setSource('');
    setAmount('');
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Income</h2>
      {incomes.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100">
          {incomes.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{i.source}</span>
              <span className="font-medium tabular-nums">{formatMoney(i.amount, moneyFormat)}</span>
              <button type="button" aria-label={`Delete income ${i.source}`} className="rounded p-1 hover:bg-slate-100" onClick={() => onDelete(i)}>
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} noValidate className="mt-3 grid grid-cols-[1fr_7rem] gap-2">
        <div>
          <label htmlFor={`${id}-source`} className={labelClass}>Source</label>
          <input id={`${id}-source`} className={inputClass} placeholder="Part-time job" value={source} onChange={(e) => setSource(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${id}-amount`} className={labelClass}>Amount</label>
          <input id={`${id}-amount`} className={`${inputClass} tabular-nums`} inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        {error && <p role="alert" className="col-span-2 text-sm text-red-700">{error}</p>}
        <button type="submit" className={`${secondaryButton} col-span-2`}>Add income</button>
      </form>
    </div>
  );
}
