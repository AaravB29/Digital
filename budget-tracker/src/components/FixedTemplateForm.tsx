import { useId, useState, type FormEvent } from 'react';
import type { FixedExpenseKind, FixedExpenseTemplate } from '../db/types';
import type { TemplateInput } from '../db/fixedActions';
import { validateTemplate, type DefaultChangeScope } from '../lib/fixed';
import { formatMoneyForInput } from '../lib/money';
import { currentMonthKey, formatMonthLabel, nextMonth } from '../lib/months';
import { inputClass, labelClass, primaryButton, secondaryButton } from './fieldStyles';
import MonthSelect from './MonthSelect';

const KINDS: Array<[FixedExpenseKind, string]> = [
  ['rent', 'Rent'], ['health_insurance', 'Health insurance'], ['subscription', 'Subscription'], ['other_fixed', 'Other fixed cost'],
];

interface Props {
  initial?: FixedExpenseTemplate;
  locale: string;
  onSave: (input: TemplateInput, scope: DefaultChangeScope) => Promise<void>;
  onCancel: () => void;
}

export default function FixedTemplateForm({ initial, locale, onSave, onCancel }: Props) {
  const id = useId();
  const thisMonth = currentMonthKey();
  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState<FixedExpenseKind>(initial?.kind ?? 'subscription');
  const [amountText, setAmountText] = useState(initial ? formatMoneyForInput(initial.defaultAmount, locale) : '');
  const [day, setDay] = useState(initial?.dayOfMonth ?? 1);
  const [activeFrom, setActiveFrom] = useState(initial?.activeFrom ?? thisMonth);
  const [hasEnd, setHasEnd] = useState(!!initial?.activeUntil);
  const [activeUntil, setActiveUntil] = useState(initial?.activeUntil ?? thisMonth);
  const [scope, setScope] = useState<DefaultChangeScope>('this_month_onward');
  const [error, setError] = useState<string | null>(null);

  const draft = { name, amountText, dayOfMonth: day, activeFrom, activeUntil: hasEnd ? activeUntil : undefined };
  const parsed = validateTemplate(draft);
  const amountChanged = !!initial && 'amount' in parsed && parsed.amount !== initial.defaultAmount;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if ('error' in parsed) return setError(parsed.error);
    await onSave({ name: name.trim(), kind, defaultAmount: parsed.amount, dayOfMonth: day, activeFrom, activeUntil: draft.activeUntil }, scope);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>Name</label>
        <input id={`${id}-name`} className={inputClass} value={name} placeholder="Netflix" autoFocus onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${id}-kind`} className={labelClass}>Type</label>
        <select id={`${id}-kind`} className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as FixedExpenseKind)}>
          {KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-amount`} className={labelClass}>Amount each month</label>
        <input id={`${id}-amount`} className={`${inputClass} tabular-nums`} inputMode="decimal" placeholder="0,00" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${id}-day`} className={labelClass}>Due on day</label>
        <select id={`${id}-day`} className={inputClass} value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-from`} className={labelClass}>Starts in</label>
        <MonthSelect id={`${id}-from`} value={activeFrom} onChange={setActiveFrom} />
      </div>
      <div>
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          <input type="checkbox" className="accent-teal-700" checked={hasEnd} onChange={(e) => setHasEnd(e.target.checked)} />
          Ends after
        </label>
        <MonthSelect id={`${id}-until`} value={activeUntil} onChange={setActiveUntil} disabled={!hasEnd} />
      </div>
      {amountChanged && (
        <fieldset className="rounded-lg border border-amber-300 bg-amber-50 p-3 sm:col-span-2">
          <legend className="px-1 text-sm font-medium">Apply the new amount to</legend>
          {([
            ['this_month_onward', `This month onward (from ${formatMonthLabel(thisMonth)})`],
            ['future_only', `Future months only (from ${formatMonthLabel(nextMonth(thisMonth))})`],
          ] as const).map(([value, label]) => (
            <label key={value} className="mt-1 flex items-center gap-2 text-sm">
              <input type="radio" name={`${id}-scope`} className="accent-teal-700" checked={scope === value} onChange={() => setScope(value)} />
              {label}
            </label>
          ))}
          <p className="mt-2 text-xs text-slate-600">Past months and amounts you changed for a single month stay as they are.</p>
        </fieldset>
      )}
      {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className={primaryButton}>{initial ? 'Save' : 'Add fixed expense'}</button>
        <button type="button" className={secondaryButton} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
