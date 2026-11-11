import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, formatMoneyShort, type MoneyFormat } from '../../lib/money';
import { shortMonthLabel } from '../../lib/months';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { axisProps, useChartColors } from './chartTheme';

interface Props {
  months: string[];
  values: number[];
  average: number;
  label: string;
  color: string;
  moneyFormat: MoneyFormat;
}

/** One category over time, with its average as a dashed reference line. */
export default function CategoryTrendChart({ months, values, average, label, color, moneyFormat }: Props) {
  const c = useChartColors();
  const data = months.map((m, i) => ({ label: shortMonthLabel(m), [label]: values[i] }));
  return (
    <>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="label" {...axisProps(c)} />
            <YAxis {...axisProps(c)} axisLine={false} width={64} tickFormatter={(v: number) => formatMoneyShort(v, moneyFormat)} />
            <Tooltip content={<ChartTooltip moneyFormat={moneyFormat} footer={() => `Average ${formatMoney(average, moneyFormat)}`} />} />
            <ReferenceLine y={average} stroke={c.axis} strokeDasharray="5 4" strokeWidth={1.5} />
            <Line dataKey={label} stroke={color} strokeWidth={2} dot={{ r: 4, fill: color, stroke: c.surface, strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label, color, line: true },
          { label: 'Average', color: c.axis, line: true, dashed: true, value: formatMoney(average, moneyFormat) },
        ]}
      />
    </>
  );
}
