import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthPoint } from '../../lib/stats';
import { formatMoneyShort, type MoneyFormat } from '../../lib/money';
import { shortMonthLabel } from '../../lib/months';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { axisProps, CHART } from './chartTheme';

export default function SpendingIncomeChart({ series, moneyFormat }: { series: MonthPoint[]; moneyFormat: MoneyFormat }) {
  const data = series.map((p) => ({ label: shortMonthLabel(p.month), Spent: p.spent, Income: p.income }));
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} axisLine={false} width={64} tickFormatter={(v: number) => formatMoneyShort(v, moneyFormat)} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip moneyFormat={moneyFormat} />} />
            <Bar dataKey="Spent" fill={CHART.spent} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
            <Line dataKey="Income" stroke={CHART.income} strokeWidth={2} dot={{ r: 4, fill: CHART.income, stroke: CHART.surface, strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend items={[{ label: 'Spent', color: CHART.spent }, { label: 'Income', color: CHART.income, line: true }]} />
    </>
  );
}
