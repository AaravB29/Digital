import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, formatMoneyShort, type MoneyFormat } from '../../lib/money';
import { shortMonthLabel } from '../../lib/months';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { axisProps, CHART } from './chartTheme';

export interface StackSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

/** One bar per month, split by category; small categories arrive already folded into "Other". */
export default function CategoryStackChart({ months, series, moneyFormat }: { months: string[]; series: StackSeries[]; moneyFormat: MoneyFormat }) {
  const data = months.map((m, i) => ({ label: shortMonthLabel(m), ...Object.fromEntries(series.map((s) => [s.label, s.values[i]])) }));
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} axisLine={false} width={64} tickFormatter={(v: number) => formatMoneyShort(v, moneyFormat)} />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              content={
                <ChartTooltip
                  moneyFormat={moneyFormat}
                  footer={(rows) => `Total ${formatMoney(rows.reduce((s, r) => s + (r.value as number), 0), moneyFormat)}`}
                />
              }
            />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.label} stackId="month" fill={s.color} stroke={CHART.surface} strokeWidth={1} maxBarSize={36} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend items={series.map((s) => ({ label: s.label, color: s.color }))} />
    </>
  );
}
