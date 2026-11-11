import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney, type MoneyFormat } from '../../lib/money';
import ChartTooltip from './ChartTooltip';
import { useChartColors } from './chartTheme';

export interface DonutSlice {
  key: string;
  label: string;
  color: string;
  total: number;
  percent: number;
}

/** Donut with a legend that carries every name, amount and percentage. */
export default function CategoryDonut({ slices, total, moneyFormat }: { slices: DonutSlice[]; total: number; moneyFormat: MoneyFormat }) {
  const c = useChartColors();
  if (slices.length === 0) return <p className="py-10 text-center text-slate-500">No spending in this month.</p>;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="total" nameKey="label" innerRadius="62%" outerRadius="100%" stroke={c.surface} strokeWidth={2} isAnimationActive={false}>
              {slices.map((s) => <Cell key={s.key} fill={s.color} />)}
            </Pie>
            <Tooltip content={<ChartTooltip moneyFormat={moneyFormat} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500">Total</span>
          <span className="font-semibold">{formatMoney(total, moneyFormat)}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 divide-y divide-slate-100 text-sm">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-2 py-1.5">
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="tabular-nums text-slate-500">{s.percent.toLocaleString(moneyFormat.locale)} %</span>
            <span className="w-24 text-right tabular-nums">{formatMoney(s.total, moneyFormat)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
