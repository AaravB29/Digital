import type { MonthSummary } from '../lib/stats';
import { formatMoney, type MoneyFormat } from '../lib/money';

interface Props {
  summary: MonthSummary;
  format: MoneyFormat;
}

export default function SummaryBar({ summary, format }: Props) {
  const overspent = summary.remaining < 0;
  const items = [
    { label: 'Income', value: formatMoney(summary.income, format), tone: 'text-slate-900' },
    { label: 'Spent', value: formatMoney(summary.spent, format), tone: 'text-slate-900' },
    { label: 'Remaining', value: formatMoney(summary.remaining, format), tone: overspent ? 'text-red-700' : 'text-emerald-700' },
    {
      label: '% of income spent',
      value: summary.percentSpent === null ? '–' : `${summary.percentSpent} %`,
      tone: summary.percentSpent !== null && summary.percentSpent > 100 ? 'text-red-700' : 'text-slate-900',
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-slate-500">{item.label}</dt>
          <dd className={`mt-1 text-lg font-semibold tabular-nums ${item.tone}`}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
