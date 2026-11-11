import { format, parseISO } from 'date-fns';
import type { Category, Expense } from '../db/types';
import { formatMoney, type MoneyFormat } from '../lib/money';

interface Props {
  expenses: Expense[];
  categories: Map<string, Category>;
  moneyFormat: MoneyFormat;
}

export default function TopExpenses({ expenses, categories, moneyFormat }: Props) {
  if (expenses.length === 0) return <p className="py-4 text-sm text-slate-500">No expenses in this range.</p>;
  return (
    <ol className="divide-y divide-slate-100 text-sm">
      {expenses.map((e, i) => {
        const c = categories.get(e.categoryId);
        return (
          <li key={e.id} className="flex items-center gap-3 py-2">
            <span className="w-4 text-slate-400 tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate">{e.note || c?.name || 'Expense'}</p>
              <p className="truncate text-xs text-slate-500">
                {format(parseISO(e.date), 'd MMM yyyy')} · {c?.icon} {c?.name ?? 'Unknown'}
              </p>
            </div>
            <span className="font-medium tabular-nums">{formatMoney(e.amount, moneyFormat)}</span>
          </li>
        );
      })}
    </ol>
  );
}
