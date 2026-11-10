import { useState } from 'react';
import type { MonthKey } from '../db/types';
import { currentMonthKey, formatMonthLabel, isFutureMonth, nextMonth, prevMonth } from '../lib/months';
import MonthPicker from './MonthPicker';

interface Props {
  month: MonthKey;
  onChange: (month: MonthKey) => void;
}

const navButton = 'rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-teal-600';

export default function MonthHeader({ month, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isCurrent = month === currentMonthKey();

  return (
    <header className="flex flex-wrap items-center gap-2">
      <button type="button" aria-label="Previous month" className={navButton} onClick={() => onChange(prevMonth(month))}>
        ◀
      </button>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          className="rounded-lg px-2 py-1 text-xl font-semibold hover:bg-slate-200 md:text-2xl"
          onClick={() => setPickerOpen(!pickerOpen)}
        >
          {formatMonthLabel(month)}
        </button>
        {pickerOpen && (
          <MonthPicker
            month={month}
            onClose={() => setPickerOpen(false)}
            onPick={(m) => {
              setPickerOpen(false);
              onChange(m);
            }}
          />
        )}
      </div>
      <button type="button" aria-label="Next month" className={navButton} onClick={() => onChange(nextMonth(month))}>
        ▶
      </button>
      {isFutureMonth(month) && (
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">planned</span>
      )}
      {!isCurrent && (
        <button
          type="button"
          className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          onClick={() => onChange(currentMonthKey())}
        >
          Today
        </button>
      )}
    </header>
  );
}
