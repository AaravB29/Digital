import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthPoint } from '../../lib/stats';
import { formatMoneyShort, type MoneyFormat } from '../../lib/money';
import { shortMonthLabel } from '../../lib/months';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { axisProps, useChartColors } from './chartTheme';

export default function FixedVariableChart({ series, moneyFormat }: { series: MonthPoint[]; moneyFormat: MoneyFormat }) {
  const c = useChartColors();
  const data = series.map((p) => ({ label: shortMonthLabel(p.month), Fixed: p.fixed, Variable: p.variable }));
  const dot = (color: string) => ({ r: 4, fill: color, stroke: c.surface, strokeWidth: 2 });
  return (
    <>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="label" {...axisProps(c)} />
            <YAxis {...axisProps(c)} axisLine={false} width={64} tickFormatter={(v: number) => formatMoneyShort(v, moneyFormat)} />
            <Tooltip content={<ChartTooltip moneyFormat={moneyFormat} />} />
            <Line dataKey="Fixed" stroke={c.fixed} strokeWidth={2} dot={dot(c.fixed)} isAnimationActive={false} />
            <Line dataKey="Variable" stroke={c.variable} strokeWidth={2} dot={dot(c.variable)} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: 'Fixed (rent, insurance, subscriptions)', color: c.fixed, line: true },
          { label: 'Variable (everything else)', color: c.variable, line: true },
        ]}
      />
    </>
  );
}
