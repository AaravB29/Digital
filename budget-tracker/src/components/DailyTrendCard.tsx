import { useMonthPair } from '../hooks/useStats';
import type { Category, MonthKey } from '../db/types';
import { cumulativeByDay, dailyComparison, plannedMonthTotal } from '../lib/stats';
import { formatMoney, type MoneyFormat } from '../lib/money';
import { currentMonthKey, formatMonthLabel, monthDateBounds } from '../lib/months';
import ChartCard from './charts/ChartCard';
import DailyTrendChart from './charts/DailyTrendChart';
import MonthSelect from './MonthSelect';

interface Props {
  month: MonthKey;
  onMonthChange: (month: MonthKey) => void;
  categories: Category[];
  moneyFormat: MoneyFormat;
}

const daysIn = (m: MonthKey) => Number(monthDateBounds(m)[1].slice(8, 10));

export default function DailyTrendCard({ month, onMonthChange, categories, moneyFormat }: Props) {
  const { previous, current, before } = useMonthPair(month);
  const fixedIds = new Set(categories.filter((c) => c.isFixed).map((c) => c.id));
  const today = new Date();
  const isCurrent = month === currentMonthKey(today);
  const curLine = cumulativeByDay(current, month, daysIn(month));
  const prevLine = cumulativeByDay(before, previous, daysIn(previous));
  const shownDays = isCurrent ? today.getDate() : curLine.length;
  const points = dailyComparison(curLine, prevLine, shownDays);
  const planned = plannedMonthTotal(current.filter((e) => fixedIds.has(e.categoryId)).reduce((s, e) => s + e.amount, 0), categories);

  const soFar = curLine[shownDays - 1] ?? 0;
  const prevSameDay = prevLine[Math.min(shownDays, prevLine.length) - 1] ?? 0;
  const diff = soFar - prevSameDay;

  return (
    <ChartCard
      title="Day by day"
      subtitle={`Running total through ${formatMonthLabel(month)}`}
      action={<div className="w-full sm:w-72"><MonthSelect id="daily-month" value={month} onChange={onMonthChange} /></div>}
    >
      <p className="mb-2 text-sm text-slate-600">
        {isCurrent ? `By today (day ${shownDays})` : `By the end of the month`}: <span className="font-semibold text-slate-900">{formatMoney(soFar, moneyFormat)}</span>
        {prevSameDay > 0 || soFar > 0 ? (
          <>
            {' · '}
            <span className={diff > 0 ? 'text-red-700' : diff < 0 ? 'text-emerald-700' : ''}>
              {diff === 0 ? 'same as' : `${formatMoney(Math.abs(diff), moneyFormat)} ${diff > 0 ? 'more than' : 'less than'}`}
            </span>{' '}
            {formatMonthLabel(previous)} {isCurrent ? 'by the same day' : ''}
          </>
        ) : null}
      </p>
      {curLine.every((v) => v === 0) && prevLine.every((v) => v === 0) ? (
        <p className="py-10 text-center text-slate-500">No spending in {formatMonthLabel(month)} or {formatMonthLabel(previous)} yet.</p>
      ) : (
      <DailyTrendChart points={points} currentLabel={formatMonthLabel(month)} previousLabel={formatMonthLabel(previous)} planned={planned} moneyFormat={moneyFormat} />
      )}
    </ChartCard>
  );
}
