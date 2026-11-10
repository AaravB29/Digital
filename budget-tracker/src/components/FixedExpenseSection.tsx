import { Link } from 'react-router-dom';
import type { Expense, FixedExpenseTemplate } from '../db/types';
import { editFixedAmount, resetFixedAmount, setFixedPaid } from '../db/fixedActions';
import { fixedSummary } from '../lib/fixed';
import { formatMoney, type MoneyFormat } from '../lib/money';
import FixedExpenseRow from './FixedExpenseRow';

interface Props {
  rows: Expense[];
  templates: FixedExpenseTemplate[];
  moneyFormat: MoneyFormat;
}

export default function FixedExpenseSection({ rows, templates, moneyFormat }: Props) {
  const byId = new Map(templates.map((t) => [t.id, t]));
  const s = fixedSummary(rows);

  return (
    <section aria-label="Fixed expenses">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="font-semibold">Fixed expenses</h2>
        {rows.length > 0 && (
          <p className="text-sm text-slate-600">
            {s.paidCount} of {s.count} paid · <span className="font-medium">{formatMoney(s.due, moneyFormat)}</span> still due
          </p>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-slate-500">
          No fixed expenses this month. Set them up in{' '}
          <Link to="/settings" className="font-medium text-teal-700 underline">Settings</Link>.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {rows.map((r) => (
            <FixedExpenseRow
              key={r.id}
              row={r}
              template={r.templateId ? byId.get(r.templateId) : undefined}
              moneyFormat={moneyFormat}
              onTogglePaid={(row, paid) => void setFixedPaid(row.id, paid)}
              onEditAmount={editFixedAmount}
              onReset={(row) => void resetFixedAmount(row)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
