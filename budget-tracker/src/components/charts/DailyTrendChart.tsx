import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayPoint } from '../../lib/stats';
import { formatMoney, formatMoneyShort, type MoneyFormat } from '../../lib/money';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { axisProps, useChartColors } from './chartTheme';

interface Props {
  points: DayPoint[];
  currentLabel: string;
  previousLabel: string;
  planned: number | null;
  moneyFormat: MoneyFormat;
}

/** Running total through the month, next to the previous month, with the planned total as a dashed line. */
export default function DailyTrendChart({ points, currentLabel, previousLabel, planned, moneyFormat }: Props) {
  const c = useChartColors();
  const data = points.map((p) => ({ day: p.day, [currentLabel]: p.current, [previousLabel]: p.previous }));
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="day" {...axisProps(c)} interval="preserveStartEnd" />
            <YAxis {...axisProps(c)} axisLine={false} width={64} tickFormatter={(v: number) => formatMoneyShort(v, moneyFormat)} />
            <Tooltip content={<ChartTooltip moneyFormat={moneyFormat} labelPrefix="Day " />} />
            {planned !== null && <ReferenceLine y={planned} stroke={c.axis} strokeDasharray="5 4" strokeWidth={1.5} />}
            <Line dataKey={previousLabel} stroke={c.previous} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
            <Line dataKey={currentLabel} stroke={c.spent} strokeWidth={2} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: currentLabel, color: c.spent, line: true },
          { label: previousLabel, color: c.previous, line: true },
          ...(planned !== null ? [{ label: 'Fixed costs + budgets', color: c.axis, line: true, dashed: true, value: formatMoney(planned, moneyFormat) }] : []),
        ]}
      />
    </>
  );
}
