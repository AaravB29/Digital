import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthPoint } from '../../lib/stats';
import { formatMoneyShort, type MoneyFormat } from '../../lib/money';
import { shortMonthLabel } from '../../lib/months';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { axisProps, CHART } from './chartTheme';

export default function FixedVariableChart({ series, moneyFormat }: { series: MonthPoint[]; moneyFormat: MoneyFormat }) {
  const data = series.map((p) => ({ label: shortMonthLabel(p.month), Fixed: p.fixed, Variable: p.variable }));
  const dot = (color: string) => ({ r: 4, fill: color, stroke: CHART.surface, strokeWidth: 2 });
  return (
    <>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} axisLine={false} width={64} tickFormatter={(v: number) => formatMoneyShort(v, moneyFormat)} />
            <Tooltip content={<ChartTooltip moneyFormat={moneyFormat} />} />
            <Line dataKey="Fixed" stroke={CHART.fixed} strokeWidth={2} dot={dot(CHART.fixed)} isAnimationActive={false} />
            <Line dataKey="Variable" stroke={CHART.variable} strokeWidth={2} dot={dot(CHART.variable)} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: 'Fixed (rent, insurance, subscriptions)', color: CHART.fixed, line: true },
          { label: 'Variable (everything else)', color: CHART.variable, line: true },
        ]}
      />
    </>
  );
}
