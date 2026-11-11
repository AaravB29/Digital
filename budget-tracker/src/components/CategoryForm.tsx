import { useId, useState, type FormEvent } from 'react';
import type { Category } from '../db/types';
import type { CategoryInput } from '../db/categoryActions';
import { validateCategory } from '../lib/categories';
import { formatMoneyForInput } from '../lib/money';
import { inputClass, labelClass, primaryButton, secondaryButton } from './fieldStyles';

interface Props {
  initial?: Category;
  others: Category[];
  locale: string;
  onSave: (input: CategoryInput) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({ initial, others, locale, onSave, onCancel }: Props) {
  const id = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [color, setColor] = useState(initial?.color ?? '#0d9488');
  const [budgetText, setBudgetText] = useState(initial?.monthlyBudget ? formatMoneyForInput(initial.monthlyBudget, locale) : '');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = validateCategory({ name, budgetText }, others);
    if ('error' in result) return setError(result.error);
    await onSave({ name: result.name, icon: icon.trim(), color, monthlyBudget: result.monthlyBudget });
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-[1fr_5rem_4rem] gap-3">
      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>Name</label>
        <input id={`${id}-name`} className={inputClass} value={name} placeholder="Gifts" autoFocus onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${id}-icon`} className={labelClass}>Icon</label>
        <input id={`${id}-icon`} className={`${inputClass} text-center`} value={icon} placeholder="🎁" maxLength={8} onChange={(e) => setIcon(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${id}-color`} className={labelClass}>Colour</label>
        <input id={`${id}-color`} type="color" className="h-[42px] w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>
      <div className="col-span-3">
        <label htmlFor={`${id}-budget`} className={labelClass}>Monthly budget (optional)</label>
        <input id={`${id}-budget`} className={`${inputClass} tabular-nums sm:max-w-48`} inputMode="decimal" placeholder="No budget" value={budgetText} onChange={(e) => setBudgetText(e.target.value)} />
      </div>
      {error && <p role="alert" className="col-span-3 text-sm text-red-700">{error}</p>}
      <div className="col-span-3 flex gap-2">
        <button type="submit" className={primaryButton}>{initial ? 'Save' : 'Add category'}</button>
        <button type="button" className={secondaryButton} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
