import { useState } from 'react';
import type { MonthKey } from '../db/types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  month: MonthKey;
  onPick: (month: MonthKey) => void;
  onClose: () => void;
}

export default function MonthPicker({ month, onPick, onClose }: Props) {
  const [year, setYear] = useState(Number(month.slice(0, 4)));
  const selected = Number(month.slice(5, 7));

  return (
    <div
      role="dialog"
      aria-label="Choose month"
      className="absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Previous year" className="rounded px-2 py-1 hover:bg-slate-100" onClick={() => setYear(year - 1)}>
          ◀
        </button>
        <span className="font-semibold tabular-nums">{year}</span>
        <button type="button" aria-label="Next year" className="rounded px-2 py-1 hover:bg-slate-100" onClick={() => setYear(year + 1)}>
          ▶
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTH_NAMES.map((name, i) => {
          const isSelected = year === Number(month.slice(0, 4)) && i + 1 === selected;
          return (
            <button
              key={name}
              type="button"
              className={`rounded-lg py-2 text-sm ${isSelected ? 'bg-teal-700 text-white' : 'hover:bg-slate-100'}`}
              onClick={() => onPick(`${year}-${String(i + 1).padStart(2, '0')}`)}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
