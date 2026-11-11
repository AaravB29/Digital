import { Link } from 'react-router-dom';
import type { Category } from '../db/types';
import type { BudgetRow } from '../lib/stats';
import { budgetStatus } from '../lib/categories';
import { formatMoney, type MoneyFormat } from '../lib/money';
import BudgetBar from './BudgetBar';

interface Props {
  rows: BudgetRow[];
  categories: Map<string, Category>;
  moneyFormat: MoneyFormat;
}

const LEVEL = { ok: 'text-emerald-700', warn: 'text-amber-700', over: 'text-red-700' } as const;

export default function BudgetVsActualTable({ rows, categories, moneyFormat }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-4 text-sm text-slate-500">
        No budgets set. Add a monthly budget to a category in <Link to="/settings" className="font-medium text-teal-700 underline">Settings</Link>.
      </p>
    );
  }
  const cell = 'px-2 py-2 text-right tabular-nums whitespace-nowrap';
  return (
    <div className="relative -mx-4 overflow-x-auto px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="py-2 pr-2 text-left font-medium">Category</th>
            <th scope="col" className={`${cell} font-medium`}>Budget</th>
            <th scope="col" className={`${cell} font-medium`}>Spent</th>
            <th scope="col" className={`${cell} font-medium`}>Left</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const c = categories.get(r.categoryId);
            const level = budgetStatus(r.actual, r.budget)?.level ?? 'ok';
            return (
              <tr key={r.categoryId}>
                <th scope="row" className="py-2 pr-2 text-left font-normal">
                  {c?.icon} {c?.name ?? r.categoryId}
                  <BudgetBar spent={r.actual} budget={r.budget} className="mt-1 w-full max-w-40" />
                </th>
                <td className={cell}>{formatMoney(r.budget, moneyFormat)}</td>
                <td className={cell}>{formatMoney(r.actual, moneyFormat)}<span className="block text-xs text-slate-500">{r.percent} %</span></td>
                <td className={`${cell} font-medium ${LEVEL[level]}`}>
                  {r.remaining < 0 ? `${formatMoney(-r.remaining, moneyFormat)} over` : formatMoney(r.remaining, moneyFormat)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
