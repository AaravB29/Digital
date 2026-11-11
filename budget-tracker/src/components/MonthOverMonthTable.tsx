import type { Category } from '../db/types';
import { monthOverMonthChange } from '../lib/stats';
import { formatMoney, type MoneyFormat } from '../lib/money';
import { shortMonthLabel } from '../lib/months';

interface Props {
  months: string[];
  rows: Array<{ category: Category; values: number[] }>;
  totals: number[];
  moneyFormat: MoneyFormat;
}

function Change({ current, previous, moneyFormat }: { current: number; previous: number; moneyFormat: MoneyFormat }) {
  const { diff, percent } = monthOverMonthChange(current, previous);
  if (diff === 0) return <span className="text-slate-500">±0</span>;
  const up = diff > 0;
  return (
    <span className={up ? 'text-red-700' : 'text-emerald-700'}>
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      <span className="sr-only">{up ? 'up' : 'down'}</span> {formatMoney(Math.abs(diff), moneyFormat)}
      {percent !== null && <span className="block text-xs">{`${up ? '+' : ''}${percent.toLocaleString(moneyFormat.locale)} %`}</span>}
    </span>
  );
}

/** Categories down the side, months across, change vs the previous month at the end. */
export default function MonthOverMonthTable({ months, rows, totals, moneyFormat }: Props) {
  const last = months.length - 1;
  const cell = 'px-3 py-2 text-right tabular-nums whitespace-nowrap';
  return (
    <div className="relative -mx-4 overflow-x-auto px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="sticky left-0 bg-white py-2 pr-3 text-left font-medium">Category</th>
            {months.map((m) => <th key={m} scope="col" className={`${cell} font-medium`}>{shortMonthLabel(m)}</th>)}
            {last > 0 && <th scope="col" className={`${cell} font-medium`}>vs {shortMonthLabel(months[last - 1])}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ category, values }) => (
            <tr key={category.id}>
              <th scope="row" className="sticky left-0 whitespace-nowrap bg-white py-2 pr-3 text-left font-normal">
                <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: category.color }} />
                {category.name}
              </th>
              {values.map((v, i) => <td key={months[i]} className={`${cell} ${v === 0 ? 'text-slate-400' : ''}`}>{formatMoney(v, moneyFormat)}</td>)}
              {last > 0 && <td className={cell}><Change current={values[last]} previous={values[last - 1]} moneyFormat={moneyFormat} /></td>}
            </tr>
          ))}
          <tr className="border-t-2 border-slate-200 font-semibold">
            <th scope="row" className="sticky left-0 bg-white py-2 pr-3 text-left">Total</th>
            {totals.map((v, i) => <td key={months[i]} className={cell}>{formatMoney(v, moneyFormat)}</td>)}
            {last > 0 && <td className={cell}><Change current={totals[last]} previous={totals[last - 1]} moneyFormat={moneyFormat} /></td>}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
