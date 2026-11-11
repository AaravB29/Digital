import type { MonthKey } from '../db/types';
import type { RangePreset } from '../lib/months';
import MonthSelect from './MonthSelect';

export type RangeChoice = RangePreset | 'custom';

const OPTIONS: Array<[RangeChoice, string]> = [
  ['last3', 'Last 3 months'], ['last6', 'Last 6 months'], ['last12', 'Last 12 months'], ['thisYear', 'This year'], ['custom', 'Custom'],
];

interface Props {
  choice: RangeChoice;
  from: MonthKey;
  to: MonthKey;
  onChoice: (choice: RangeChoice) => void;
  onCustom: (from: MonthKey, to: MonthKey) => void;
}

export default function RangeSelector({ choice, from, to, onChoice, onCustom }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Time range" className="relative -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {OPTIONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={choice === value}
            onClick={() => onChoice(value)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              choice === value ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {choice === 'custom' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="range-from" className="text-xs font-medium uppercase tracking-wide text-slate-500">From</label>
            <MonthSelect id="range-from" value={from} onChange={(m) => onCustom(m, m > to ? m : to)} />
          </div>
          <div>
            <label htmlFor="range-to" className="text-xs font-medium uppercase tracking-wide text-slate-500">To</label>
            <MonthSelect id="range-to" value={to} onChange={(m) => onCustom(m < from ? m : from, m)} />
          </div>
        </div>
      )}
    </div>
  );
}
