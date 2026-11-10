import type { MonthKey } from '../db/types';
import { inputClass } from './fieldStyles';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  id: string;
  value: MonthKey;
  onChange: (month: MonthKey) => void;
  disabled?: boolean;
}

/** Month + year dropdowns; works in every browser, unlike <input type="month">. */
export default function MonthSelect({ id, value, onChange, disabled }: Props) {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => thisYear - 5 + i);
  if (!years.includes(year)) years.push(year);
  const emit = (y: number, m: number) => onChange(`${y}-${String(m).padStart(2, '0')}`);

  return (
    <div className="flex gap-2">
      <select id={id} aria-label="Month" className={inputClass} disabled={disabled} value={month} onChange={(e) => emit(year, Number(e.target.value))}>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <select aria-label="Year" className={`${inputClass} w-28`} disabled={disabled} value={year} onChange={(e) => emit(Number(e.target.value), month)}>
        {years.sort().map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
